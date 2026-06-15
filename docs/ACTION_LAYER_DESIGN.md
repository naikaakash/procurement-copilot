# Action Layer Design — Procurement Copilot
## Release 1: Supplier Commitment Core (Phase 6B — Design Only)

> [!IMPORTANT]
> This document is design-only. Nothing in this document is implemented yet.
> No database tables, no write services, no frontend action buttons exist yet.
> Implementation will happen in Phase 7 or later.

---

## 1. Purpose

The Action Layer is the part of Procurement Copilot that allows buyers to record their responses to procurement exceptions — follow-up notes, internal escalation flags, supplier contact records, and review status. It is distinct from reading ERP data and must be designed carefully to:

- Respect the boundary between SAP-owned truth and app-owned workflow state.
- Support future multi-user concurrency safely.
- Provide a full audit trail without building a full-scale ERP system.
- Stay simple enough to implement incrementally without breaking Release 1 behavior.

---

## 2. Core Design Principle

> **Cache is for visibility.**
> **SAP is for truth.**
> **Live validation is for action.**

- Dashboards, lists, and worklists load from the app's local cache (today: CSV files; future: an app read database refreshed from SAP delta feeds).
- SAP is the authoritative source for official PO data, quantities, prices, and supplier master.
- Before any sensitive action that affects or reflects SAP data (e.g. confirming a delivery, updating a PO line), the app must perform a live read from SAP to validate the current state — not rely on cached data.
- When SAP data has changed between the buyer's last page load and their attempted action, the app must detect this and show a clear user-facing conflict error, not silently overwrite.

---

## 3. SAP-Owned vs App-Owned Data

### 3.1 SAP-Owned Data (Never modified by the app)

The following fields are owned by SAP and represent the official system of record. The app must never update these fields directly — even in the future with a write integration. Any change to these values must go through SAP.

| Data Element | SAP Table | Description |
|---|---|---|
| PO Header | `EKKO` | Official PO document, status, release |
| PO Line Item | `EKPO` | Item, material, quantity, price |
| PO Schedule Line | `EKET` | Delivery date, scheduled qty |
| Supplier Master | `LFA1` | Supplier name, address, payment terms |
| Official Ordered Quantity | `EKET-MENGE` | SAP-confirmed ordered qty |
| Official Delivery Date | `EKET-EINDT` | SAP-confirmed due date |
| Official Net Price | `EKPO-NETPR` | SAP-confirmed price |
| Goods Receipt | `MSEG / MKPF` | Official receipt postings |
| Official PO Acknowledgement | `EKES` | Supplier-confirmed delivery from portal |
| Quality Inspection Results | `QMEL` | SAP quality module data |
| Incoterms / Payment Terms | `LFM1` | Supplier procurement config |

### 3.2 App-Owned Data (Managed by Procurement Copilot)

The following data elements are created and maintained by the app. They represent buyer workflow state, not ERP state.

| Data Element | Description | Phase |
|---|---|---|
| Buyer follow-up note | Free-text note left by the buyer about a PO line | Phase 7 |
| Internal follow-up status | PENDING / IN_PROGRESS / ESCALATED / CLOSED | Phase 7 |
| Supplier contacted flag | Boolean — has the buyer contacted the supplier? | Phase 7 |
| Escalation flag | Boolean — has this been escalated to management? | Phase 7 |
| Assigned owner | Which buyer "owns" this exception | Phase 7 |
| Reminder date | When to resurface this exception | Phase 7 |
| Internal risk classification | App-side override risk label | Phase 7 |
| Manual exception comment | Admin or buyer comment visible inside the app | Phase 7 |
| User review status | UNREVIEWED / REVIEWED / ACTIONED | Phase 7 |
| Follow-up action record | Full action object (see §6) | Phase 7 |
| Audit trail entry | Every write creates an audit log entry | Phase 7 |

---

## 4. App-Owned Actions in Release 1 Scope

These are the actions the app may own in Release 1. They do not touch SAP directly.

| Action | Triggered by | Effect |
|---|---|---|
| Record follow-up note | Buyer clicks "Add Note" | Creates `FollowUpAction` with type `NOTE` |
| Mark supplier contacted | Buyer clicks "Mark Contacted" | Creates `FollowUpAction` with type `SUPPLIER_CONTACTED` |
| Escalate internally | Buyer clicks "Escalate" | Creates `FollowUpAction` with type `ESCALATION` |
| Set reminder date | Buyer sets a follow-up date | Creates `FollowUpAction` with type `REMINDER` |
| Mark line reviewed | Buyer clicks "Mark Reviewed" | Updates exception review status |
| Assign owner | Buyer or admin assigns a line to another buyer | Updates exception ownership |

### 4.1 Not In Scope for Release 1
- Sending automated emails to suppliers.
- Updating PO line status in SAP.
- Approving or rejecting supplier acknowledgements in SAP.
- Writing back to SAP in any way.
- Multi-agent auto-reminders.

---

## 5. Actions That Must Remain SAP-Owned

These are future capabilities where SAP must remain the system of record. The app may propose the action to the buyer, but the actual SAP update must happen through SAP (OData, BAPI, or workflow) and then be reflected back into the app via delta sync.

| Action | SAP Mechanism | App Role |
|---|---|---|
| Create PO confirmation | `ME22N` / OData PATCH | Propose draft; buyer approves; SAP executes |
| Update delivery date confirmation | `EKES` write via OData | Propose draft; validate ETag before write |
| Post Goods Receipt | `MIGO` / `MBLNR` | Read-only view in app; GR posted in SAP |
| Release PO block | `EKKO` release flag | Propose; buyer sends to SAP portal |
| Cancel PO line | `EKPO-ELIKZ` | Propose; buyer sends to SAP portal |

---

## 6. Proposed Future Action Service

### 6.1 Proposed Service Name
`src/services/actionService.ts`

The action service will:
- Validate that the buyer is authorized to act on the exception.
- Optionally perform a live SAP read before sensitive actions.
- Write the action record to the app's own database (Phase 7+).
- Create an audit log entry.
- Return a success/conflict/error response.

### 6.2 Proposed Action Types

```typescript
export type ActionType =
  | 'NOTE'               // Buyer follow-up note
  | 'SUPPLIER_CONTACTED' // Marked supplier as contacted
  | 'ESCALATION'         // Escalated to management
  | 'REMINDER'           // Set a reminder/follow-up date
  | 'REVIEWED'           // Marked line as reviewed
  | 'OWNER_CHANGE'       // Assigned/changed owner
  | 'RISK_OVERRIDE'      // Manual risk classification change
  | 'COMMENT'            // General admin or buyer comment
  ;
```

### 6.3 Proposed Action Status

```typescript
export type ActionStatus =
  | 'PENDING'    // Created, not yet confirmed
  | 'CONFIRMED'  // Saved successfully
  | 'FAILED'     // Save failed (e.g. conflict)
  | 'SUPERSEDED' // Replaced by a later action
  ;
```

### 6.4 Proposed SAP Sync Status (for future SAP write actions)

```typescript
export type SapSyncStatus =
  | 'NOT_APPLICABLE' // App-owned action only, no SAP sync needed
  | 'PENDING'        // Queued for SAP write
  | 'SUCCESS'        // SAP write confirmed
  | 'FAILED'         // SAP write failed
  | 'CONFLICT'       // ETag mismatch or SAP state changed before write
  ;
```

---

## 7. Proposed Action Data Model

```typescript
interface FollowUpAction {
  // Identity
  actionId: string;             // UUID, app-generated
  purchaseOrderNumber: string;  // PO number (ERP key, read-only reference)
  purchaseOrderItem: string;    // Item number (ERP key, read-only reference)
  scheduleLine?: string;        // Schedule line (if applicable)
  supplierId: string;           // Supplier ID (ERP key, read-only reference)

  // Action classification
  actionType: ActionType;
  actionStatus: ActionStatus;

  // Content
  note: string;                 // Free-text note or reason
  reminderDate?: string;        // ISO date if type === 'REMINDER'

  // Ownership
  assignedTo?: string;          // User ID of assignee (if type === 'OWNER_CHANGE')
  createdBy: string;            // User ID of action creator
  updatedBy?: string;           // User ID of last updater

  // Timestamps (ISO 8601)
  createdAt: string;
  updatedAt: string;

  // Optimistic concurrency (see §9)
  version: number;              // Incremented on every write

  // System
  sourceSystem: 'APP';    // Always 'APP' for app-owned actions
  sapSyncStatus: SapSyncStatus; // 'NOT_APPLICABLE' for pure app-owned actions
}
```

---

## 8. Proposed Audit Fields

Every action write must produce an immutable audit log entry.

```typescript
interface AuditLogEntry {
  auditId: string;              // UUID, app-generated
  entityType: 'FOLLOW_UP_ACTION' | 'EXCEPTION_STATUS' | 'OWNER_ASSIGNMENT';
  entityId: string;             // ID of the changed entity
  purchaseOrderNumber: string;  // Always included for traceability
  purchaseOrderItem: string;
  supplierId: string;
  eventType: 'CREATED' | 'UPDATED' | 'DELETED' | 'SAP_SYNC_SUCCESS' | 'SAP_SYNC_FAILED';
  changedBy: string;            // User ID
  changedAt: string;            // ISO 8601 timestamp
  previousValue?: string;       // JSON snapshot of field before change
  newValue?: string;            // JSON snapshot of field after change
  sessionId?: string;           // Browser session identifier
  ipAddress?: string;           // For compliance audit (future)
}
```

---

## 9. Proposed Concurrency Model

### Optimistic Concurrency (App-Owned Actions)

Every editable action row has a `version` field (integer, starts at 1).

Write flow:
1. Frontend fetches action row (receives `version: N`).
2. Buyer edits the note/status.
3. Frontend sends update with `version: N`.
4. Backend checks: `stored.version === request.version`?
   - **Match:** Save succeeds. Increment `version` to `N+1`. Return 200.
   - **Mismatch:** Save rejected. Return `409 Conflict`. Include current version.
5. Frontend shows conflict error: "This record was updated by another user. Please refresh and try again."

This prevents silent overwrites in a multi-user environment (e.g. two buyers editing the same PO exception simultaneously).

### Live SAP Validation (Future SAP Write Actions)

For actions that write to SAP:
1. Before writing, fetch the current SAP ETag / timestamp for the PO line.
2. Compare against the ETag stored at last sync.
3. If ETag matches: proceed with SAP write. Pass ETag in `If-Match` header.
4. If ETag mismatches: abort. Fetch fresh SAP data. Show user-visible diff: "Delivery date changed in SAP since your last view. Please review and resubmit."

---

## 10. Proposed Error Handling Model

### User-Visible Errors

| Situation | Message to User |
|---|---|
| Optimistic conflict | "This record was updated by another user. Refresh to see the latest." |
| SAP ETag conflict | "SAP data changed since your last view. Please review the updated values and resubmit." |
| SAP write failed | "The system could not send your update to SAP. Please try again or contact IT support." |
| Unauthorized | "You do not have permission to perform this action." |
| Validation error | "Please fill in all required fields before submitting." |

### Admin-Visible Monitoring

| Situation | Admin Alert |
|---|---|
| SAP sync failure spike | Sync failure rate > threshold → ops alert |
| Delta sync stale | Last delta sync > configured threshold → ops alert |
| Audit log write failure | Critical — system cannot record compliance events |
| Action service error rate | Error rate > 1% over 5 minutes → ops alert |

---

## 11. Future SAP Integration Rules

> [!CAUTION]
> The app must **never** perform a full-load of all SAP procurement tables on a recurring schedule.
> Full loads are non-scalable, introduce large sync windows, and create brittle dependencies.

### Approved Integration Pattern

| Step | Description |
|---|---|
| **1. Initial scoped load** | On first connect, load only the PO lines relevant to the buyer's plants and purchasing groups. Not the full SAP table. |
| **2. Delta refresh** | Ongoing: poll or subscribe to SAP change events (OData delta token, BTP event mesh, or scheduled delta query). Sync only changed records. |
| **3. App read database for dashboards** | All dashboards and worklists read from the app's own cached database, not SAP directly. Fast, scalable. |
| **4. Live SAP read before sensitive actions** | Before any action that affects SAP (update delivery date, close exception), perform a live SAP read to validate current state. |
| **5. ETag/version validation before SAP write** | Always pass `If-Match` ETag from the live read. If SAP rejects, surface the conflict clearly. |
| **6. Conflict handling** | Show user a diff of what changed. Let buyer decide: proceed with new values, or cancel. |
| **7. User-visible error messages** | Action failures must never silently fail. Always show a clear message. |
| **8. Admin monitoring** | All sync events, failures, and latencies are logged and visible to admins via a monitoring dashboard. |

---

## 12. Out of Scope for Now

The following are explicitly **not** in scope until explicitly prioritized:

- Building any database tables or schema.
- Implementing `actionService.ts` write methods.
- Frontend action buttons (Save Note, Escalate, etc.).
- SAP OData write calls of any kind.
- SAP delta sync implementation.
- Multi-user session management or authentication.
- Email sending or notification delivery.
- Approval workflows.
- Rollback or undo functionality.
- Data retention policies.
- GDPR / compliance tooling.

---

## 13. Recommended Implementation Order (Phase 7+)

1. **Phase 7A:** Choose and provision app database (Azure SQL or Supabase). Define schema for `FollowUpAction` and `AuditLogEntry`. No frontend changes.
2. **Phase 7B:** Implement `actionService.ts` for `NOTE` and `SUPPLIER_CONTACTED` action types only. No SAP integration.
3. **Phase 7C:** Add frontend "Add Note" and "Mark Contacted" UI to the Overdue PO Workbench drawer. Wire to `actionService`.
4. **Phase 7D:** Implement optimistic concurrency for the `version` field.
5. **Phase 7E:** Implement audit log writes for all action events.
6. **Phase 8:** Add `ESCALATION`, `REMINDER`, and `OWNER_CHANGE` action types.
7. **Phase 9:** Design SAP delta sync and live-read-before-action pattern.
