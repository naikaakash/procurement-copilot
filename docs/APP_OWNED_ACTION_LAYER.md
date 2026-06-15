# App-Owned Action Layer — Procurement Copilot
## Phase 7A: Local-First Implementation

> [!NOTE]
> Phase 7A uses local JSON file persistence. This is intentional — the goal is to
> prove the workflow data model and API contract safely before connecting a real database.
> The local store is designed to be swapped for Azure SQL or Supabase in Phase 8
> without changing any API route or frontend code.

---

## 1. Purpose

The App-Owned Action Layer enables buyers to record workflow state against overdue PO
lines and supplier exceptions. It is a separate data layer from SAP/ERP data and
represents only the buyer's internal tracking of how they are responding to procurement exceptions.

**The layer answers questions like:**
- Has this PO line been reviewed by a buyer?
- Has the supplier been contacted? When? By whom?
- Has this been escalated to management?
- What follow-up note did the buyer leave?
- When is the reminder to re-check this line?
- What is the buyer's internal risk assessment?

None of these answers come from SAP. SAP does not know whether a buyer has
reviewed a PO line, called a supplier, or escalated internally.

---

## 2. What the App Owns vs What SAP Owns

### App-Owned (safe to create, update, delete in the app)

| Data Element | Type | Phase |
|---|---|---|
| Buyer follow-up note | Free text | 7A ✅ |
| Supplier contacted flag | Boolean | 7A ✅ |
| Escalation flag | Boolean | 7A ✅ |
| Internal follow-up status | OPEN / IN_PROGRESS / COMPLETED / CANCELLED | 7A ✅ |
| Review status | UNREVIEWED / REVIEWED / ACTIONED | 7A ✅ |
| Assigned owner (buyer ID) | String | 7A ✅ |
| Reminder date | ISO date | 7A ✅ |
| Internal risk classification | CRITICAL / HIGH / MEDIUM / LOW / WATCH | 7A ✅ |
| Manual exception comments | Free text | 7A ✅ |
| Acknowledgement evidence reference | Email, document ID, URL | 7A ✅ |
| Action history | Full audit of buyer actions | 7A ✅ |

### SAP-Owned (read-only from the app — never written back in Phase 7A)

| Data Element | SAP Source |
|---|---|
| PO Header | `EKKO` |
| PO Line Items | `EKPO` |
| Ordered Quantity | `EKET-MENGE` |
| Scheduled Delivery Date | `EKET-EINDT` |
| Net Price | `EKPO-NETPR` |
| Goods Receipt Quantities | `MSEG / MKPF` |
| Official PO Status | `EKKO` status flags |
| Supplier Master Data | `LFA1 / LFM1` |
| Official Supplier Acknowledgements | `EKES` / Supplier portal |

---

## 3. Why SAP Write-Back Is Excluded from Phase 7A

SAP write-back requires:
1. Live SAP credentials and OData authentication infrastructure
2. ETag / version validation before every SAP PATCH or POST call
3. Conflict resolution when SAP state changes between buyer's view and their action
4. Admin monitoring and error alerting for failed SAP writes
5. Rollback strategy if a SAP write partially succeeds
6. Security review and API key rotation plan

None of these are in scope for Phase 7A. Building them incrementally (Phase 9+) reduces risk.

The Phase 7A action layer proves:
- The data model works
- The API contract works
- Optimistic concurrency works
- The layer is separate from ERP data
- The store is replaceable

---

## 4. Architecture

```
Browser / Future Frontend Component
  ↓ fetch('/api/actions/...')
Next.js API Routes (app/api/actions/)
  ↓ import procurementActionService
Procurement Action Service (src/services/procurementActionService.ts)
  ↓ import mockActionStore
Mock Action Store (src/services/mockActionStore.ts)
  ↓ fs.readFileSync / fs.writeFileSync
data/app-actions.json (local JSON file)
```

### What the architecture does NOT touch

```
procurementDataService        ← ERP read path, unchanged
  ↓
mockErpService                ← ERP adapter, unchanged
  ↓
csvDataService                ← ERP data source, unchanged
  ↓
procurement_data_sample/*.csv ← ERP source files, never written
```

---

## 5. Local / Mock Persistence (Phase 7A)

### Strategy

- **Primary storage:** Module-level `Map<string, ProcurementAction>` (in-memory singleton).
- **Durability:** Written to `data/app-actions.json` on every mutation via `fs.writeFileSync`.
- **Load:** Reads from `data/app-actions.json` once on first access, then keeps in memory.
- **Concurrency:** Single-process safe. Not multi-process safe (acceptable for dev/demo).

### File location

```
<project-root>/data/app-actions.json
```

### Limitations (documented clearly)

| Limitation | Impact | Fix in Phase 8 |
|---|---|---|
| Single-process only | Two Node.js processes won't share state | Use a real database |
| Serverless incompatible | File writes lost on Vercel / Lambda cold starts | Use a real database |
| Not horizontally scalable | Multiple server instances won't share state | Use a real database |
| Synchronous file I/O | Blocks event loop on large stores | Use async DB driver |
| No transactions | Concurrent writes could corrupt file | Use a real database with transactions |

### Replacement path (Phase 8)

1. Create `src/services/dbActionStore.ts` implementing the same exported function signatures as `mockActionStore.ts`.
2. Update the import in `src/services/procurementActionService.ts` to point to `dbActionStore`.
3. No API route files change. No frontend files change.
4. Delete `data/app-actions.json` after migration.

---

## 6. Action Data Model

```typescript
interface ProcurementAction {
  // Identity (app-assigned)
  actionId: string;                // UUID
  purchaseOrderNumber: string;     // ERP key reference (read-only)
  purchaseOrderItem: string;       // ERP key reference (read-only)
  scheduleLine?: string;           // Optional ERP schedule line reference
  supplierId: string;              // ERP key reference (read-only)
  supplierName: string;            // Denormalized for display

  // Classification
  actionType: ProcurementActionType;
  actionStatus: ProcurementActionStatus;
  sourceModule: ActionSourceModule;

  // App-owned content fields
  note: string;
  assignedTo?: string;
  reminderDate?: string;           // YYYY-MM-DD
  supplierContacted: boolean;
  escalationFlag: boolean;
  riskClassification?: RiskClassification;
  reviewStatus: ReviewStatus;
  evidenceType?: EvidenceType;
  evidenceReference?: string;

  // Audit
  createdBy: string;
  createdAt: string;               // ISO 8601
  updatedBy: string;
  updatedAt: string;               // ISO 8601

  // Concurrency
  version: number;                 // Starts at 1; incremented on each update

  // System
  sourceSystem: 'APP';
  sapSyncStatus: SapSyncStatus;    // Phase 7A: always APP_ONLY
}
```

### Action Types

| Type | When to use |
|---|---|
| `NOTE` | Buyer leaves a free-text follow-up note |
| `SUPPLIER_CONTACTED` | Buyer has contacted the supplier directly |
| `FOLLOW_UP_REQUIRED` | Line is flagged for future attention |
| `ESCALATION` | Escalated to management or procurement lead |
| `REMINDER` | Timed reminder to revisit the line |
| `REVIEW_STATUS_CHANGE` | Buyer changed internal review status |
| `ACKNOWLEDGEMENT_EVIDENCE` | Supplier ack evidence recorded (email ref, doc, etc.) |

---

## 7. API Routes

All routes are under `/api/actions/`. All return JSON.
None touch csvDataService, SAP, or existing Release 1 read routes.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/actions` | List open/in-progress actions (filterable) |
| `POST` | `/api/actions` | Create a new action |
| `GET` | `/api/actions/po-line?purchaseOrderNumber=&purchaseOrderItem=` | Actions for one PO line |
| `GET` | `/api/actions/supplier?supplierId=` | Actions for one supplier |
| `GET` | `/api/actions/open` | All open+in-progress actions (paginated) |
| `GET` | `/api/actions/[actionId]` | Single action by ID |
| `PATCH` | `/api/actions/[actionId]` | Update an action (requires `expectedVersion`) |

### Extended route

| Method | Route | New field |
|---|---|---|
| `GET` | `/api/po-overdue/detail` | Now includes `actions: ProcurementAction[]` (additive, non-breaking) |

---

## 8. Optimistic Concurrency

Every `ProcurementAction` has a `version` field (integer, starts at 1).

### Create flow
1. `POST /api/actions` with required fields.
2. Store assigns `version: 1`, `createdAt`, `updatedAt`.
3. Returns the created action including `version`.

### Update flow
1. Frontend reads current action (sees `version: N`).
2. Frontend sends `PATCH /api/actions/[actionId]` with `{ expectedVersion: N, ...changes }`.
3. Server checks: `stored.version === N`?
   - **Match:** Apply changes. Set `version: N+1`. Return `200` with updated record.
   - **Mismatch:** Return `409 Conflict` with structured body:
     ```json
     {
       "error": "Optimistic concurrency conflict...",
       "conflict": {
         "actionId": "...",
         "expectedVersion": 3,
         "currentVersion": 4
       }
     }
     ```
4. Frontend on 409: show message — "This record was updated by another user. Refresh to see the latest."

### Why optimistic concurrency?
- Prevents two buyers silently overwriting each other's notes.
- No database locks required — performant for low-concurrency workloads.
- Clear, surfaceable error model for the frontend.
- Required for Phase 8 database upgrade (same pattern, different storage).

---

## 9. Conflict Handling

| HTTP Status | Meaning | Frontend Action |
|---|---|---|
| `200` | Success | Update local state with response body |
| `201` | Created | Add new action to local action list |
| `400` | Validation error | Show field error to buyer |
| `404` | Action not found | Show "record not found" message |
| `409` | Version conflict | Show "record was updated by another user, please refresh" |
| `500` | Unexpected error | Show generic error, log to console |

---

## 10. Testing Checklist

### Manual verification (no test framework in project yet)

Use a REST client (e.g. Bruno, Postman, curl) or browser DevTools while `npm run dev` is running.

```bash
# 1. Create a NOTE action
POST http://localhost:3000/api/actions
Content-Type: application/json
{
  "purchaseOrderNumber": "4500000437",
  "purchaseOrderItem": "00040",
  "supplierId": "VEND-001",
  "supplierName": "Test Supplier",
  "actionType": "NOTE",
  "sourceModule": "OVERDUE_WORKBENCH",
  "note": "Called supplier — they confirmed shipment Thursday.",
  "createdBy": "buyer.test"
}
# Expected: 201 with ProcurementAction (version: 1)

# 2. Get actions for that PO line
GET http://localhost:3000/api/actions/po-line?purchaseOrderNumber=4500000437&purchaseOrderItem=00040
# Expected: { actions: [<the action above>], total: 1 }

# 3. Get open actions
GET http://localhost:3000/api/actions/open
# Expected: { actions: [<the action above>], total: 1 }

# 4. Update the action (correct version)
PATCH http://localhost:3000/api/actions/<actionId>
Content-Type: application/json
{ "expectedVersion": 1, "note": "Updated note — supplier confirmed Friday now.", "updatedBy": "buyer.test" }
# Expected: 200 with version: 2

# 5. Stale version update (conflict test)
PATCH http://localhost:3000/api/actions/<actionId>
Content-Type: application/json
{ "expectedVersion": 1, "note": "This should fail" }
# Expected: 409 Conflict with conflict object

# 6. Mark supplier contacted
POST http://localhost:3000/api/actions
Content-Type: application/json
{
  "purchaseOrderNumber": "4500000437",
  "purchaseOrderItem": "00040",
  "supplierId": "VEND-001",
  "supplierName": "Test Supplier",
  "actionType": "SUPPLIER_CONTACTED",
  "sourceModule": "OVERDUE_WORKBENCH",
  "supplierContacted": true,
  "note": "Emailed supplier at 2pm.",
  "createdBy": "buyer.test"
}
# Expected: 201 with supplierContacted: true

# 7. Check PO detail drawer now includes actions
GET http://localhost:3000/api/po-overdue/detail?po_number=4500000437&item_number=00040
# Expected: existing ERP fields + actions: [<array of actions>]
```

---

## 11. Future Phases

| Phase | Goal |
|---|---|
| **Phase 8** | Replace `mockActionStore` with Azure SQL or Supabase database adapter. Same API contract — no frontend changes. |
| **Phase 8** | Add user authentication. `createdBy` / `updatedBy` come from authenticated session, not body. |
| **Phase 9** | Add SAP live-read-before-action for sensitive write operations. |
| **Phase 9** | Design and implement SAP write-back for specific action types (delivery date acknowledgement, PO confirmation). |
| **Phase 10** | Add automated reminder dispatch (email/Teams notification when `reminderDate` arrives). |
| **Phase 10** | Add escalation workflow (notify management when `escalationFlag: true`). |

---

## 12. Phase 7C: Buyer Testing Checklist

This checklist covers buyer-facing manual verification tasks to confirm readiness for business testing.

### A. Buyer Happy Path
- [ ] Open the Overdue PO workbench page.
- [ ] Click any row representing an overdue line to open the detail drawer.
- [ ] Click the **Action Workbench** tab.
- [ ] In the note input textarea, type `"Called supplier — delivery confirmed for Friday"` and click **Save Internal Note**.
- [ ] Verify that a toast message `"✅ Internal note saved."` appears.
- [ ] Verify that the note is added immediately to the **Internal Buyer Action History** timeline below.
- [ ] Clear the textbox, type `"Emailed shipping desk"` and click **Mark Supplier Contacted**.
- [ ] Verify that a toast message `"📞 Supplier contact recorded."` appears and a new action item is displayed in the timeline with a `SUPPLIER_CONTACTED` type badge and `CONTACTED` status.
- [ ] Close the detail drawer, click another item, then reopen the first item's detail drawer.
- [ ] Confirm that both actions persist in the chronological action log list.

### B. Validation Rules
- [ ] Clear the note input textarea (ensure it is completely empty).
- [ ] Click **Save Internal Note**.
- [ ] Verify that an inline validation error `"Note is required."` appears under the title "⚠️ Action Error".
- [ ] Verify that no new note action card is created in the history timeline.

### C. Action Completion & Concurrency
- [ ] Click **Mark Internal Action Complete** on an active action card.
- [ ] Verify that a toast message `"✅ Internal action completed."` appears, the card's status badge updates to `COMPLETED`, its version count increments from `v1` to `v2`, and the update buttons are hidden/disabled.

### D. Error & Concurrency Protection (Dev Mode Verification)
- [ ] Verify in development mode (`process.env.NODE_ENV === "development"`) that a small button labeled `⚡ Dev Mismatch (409)` is visible.
- [ ] Click `⚡ Dev Mismatch (409)`.
- [ ] Verify that the update fails with an error message: `"This action was updated elsewhere. Refresh the drawer and try again."`
- [ ] Confirm that in production build mode, the `⚡ Dev Mismatch (409)` button is completely hidden from standard users.

### E. Data Separation Verification
- [ ] Check `src/services/data/csvDataService.ts` via grep/source control and confirm it remains unmodified.
- [ ] Verify that the official PO CSV files in `procurement_data_sample/` are untouched (file modification dates unchanged).
- [ ] Open `data/app-actions.json` and confirm that all logged actions are stored only in this local JSON repository.

### F. Build Verification
- [ ] Run `npm run build` to confirm compilation is error-free.

