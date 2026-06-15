# Aalok Sidekick — Project Context & Rules

> [!IMPORTANT]
> **Feature freeze is active.** Before implementing any new feature, read [/docs/project-governance-feature-freeze.md](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/docs/project-governance-feature-freeze.md).

This is a permanent project memory file. It defines the product direction, architectural constraints, and behavior rules for all developer sessions.


---

## 🎯 Product Direction

* **Product Name:** Aalok Sidekick
* **Vision:** A **Supplier Commitment Control Center** that manages supplier response cycles, identifies risks, and tracks delivery commitments.
* **Current Version:** **Release 1 — Supplier Commitment Core**
* **Core Operating Loop:**
  ```mermaid
  flowchart LR
    Pull["1. Pull PO Commitment Data"] --> ID["2. Identify Overdue & Missing Acks"]
    ID --> Action["3. Buyer Takes Action"]
    Action --> Response["4. Supplier Responds"]
    Response --> Update["5. Acknowledgement & Status Updates"]
    Update --> Analytics["6. Analytics Show Supplier Behavior"]
    Analytics --> Pull
  ```

---

## 🎛️ Module Configuration (Release 1)

Release 1 focuses exclusively on four core modules. All other modules are disabled and must display as intentionally **"Not Configured"** (but not broken or buggy).

### 🟢 Enabled Modules (Core Focus)
1. **Executive Overview:** High-level dashboard highlighting critical lines, active spend, supplier count, and overall commitment health.
2. **Overdue Workbench:** Core action desk where buyers review, filter, and drill into overdue PO lines and take action.
3. **Supplier Acknowledgements:** Action list highlighting PO lines that are missing acknowledgements or have late/price-disputed commitments.
4. **Supplier Analytics:** Scorecards showing vendor delivery performance (OTD%), supplier tiers, and compliance risks.

### 🔴 Disabled Modules ("Not Configured")
The following modules must be visible in the navigation sidebar but rendered as styled **"Not Configured"** placeholder panels:
1. **Part Availability** (Part inventory and shortage tracking)
2. **Exception Analysis** (Deep-dive exception analytics)
3. **Buyer Productivity** (Action logs and task lists)
4. **Control Tower** (System setup, mapping, and admin settings)
5. **Automatic Reminders** (Automatic reminder queue and configuration)
6. **Planner Collaboration** (Buyer-planner chat or internal threads)
7. **Multi-Agent Pipeline** (Multi-agent auto-send workflow queues)
8. **Autonomous Monitor** (24x7 monitoring status and anomaly logs)

---

## ⚠️ Important Behavior Rules

1. **No Scope Expansion:** Do not add new modules or expand the application's surface area.
2. **No Unconfigured Core Features:** Do **not** build autonomous agents, autonomous monitoring, automatic email reminders, control tower integration, or planner collaboration features in this release.
3. **Professional Placeholder UI:** Disabled modules must display a clean, executive-ready dashboard panel showing:
   * Module Icon & Name
   * A label stating: `Intentionally Not Configured`
   * A short message stating: *"This module is not configured in the current Release 1: Supplier Commitment Core version. Please contact your system administrator to enable this feature."*
   * Standard dark-mode/glassmorphism styling consistent with the rest of the application.
4. **Simplification Goal:** Streamline existing routing, states, and file structures to keep the codebase clean, lean, and highly focused on the 4 core enabled modules.

---

## 📐 Field Trust Rule

For **Release 1: Supplier Commitment Core**, the following rules must be adhered to strictly to prevent data discrepancies:

1. **One Definition per Field:** Business fields must have exactly one definition used consistently across the application.
2. **Helper/Service Functions for Derived Fields:** All derived business fields (e.g. Open Quantity, Open Value, Overdue Days, Priority) must be calculated in backend service/helper functions rather than separately in React frontend components.
3. **No Falsy short-circuit fallbacks on numeric fields:** Since `0` is a valid value for quantities, spend, and other metrics, do **not** use short-circuit OR fallbacks (e.g. `baseItem?.open_quantity || fallback`). Use nullish coalescing (`??`) or explicit `undefined` checks to ensure `0` values are preserved correctly.
4. **Schedule-Line Level Alignment:** For workbench screens representing individual schedule lines, both **Ordered Quantity** and **Received Quantity** must be computed at the **schedule-line level** (not item level). Never mix item-level ordered quantities with schedule-line received quantities in the same layout or drawer. If the user clicks into a schedule-line workbench row, the detail view must consistently display schedule-line level values.

---

## 🔌 Service Layer Rule

Introduced in **Phase 5: Procurement Data Service / Mock ERP Adapter**.

1. **Use the Procurement Data Service:** All Release 1 data reads should go through `src/services/procurementDataService.ts`, not by importing `csvDataService.ts` directly. API routes and server-side logic should call `procurementDataService`.

2. **The service hides the data source:** `procurementDataService` routes calls to the correct adapter based on `DATA_SOURCE_CONFIG.mode` in `src/config/dataSource.ts`. The adapter can be CSV today and SAP tomorrow — no other code changes.

3. **CSV/Excel is an adapter, not the architecture:** `csvDataService.ts` is a valid data adapter for local development and Release 1. It must never be treated as the permanent data source or called directly from new frontend or API code.

4. **SAP must not be called from the frontend:** All SAP OData calls must go through the backend service layer. The frontend only calls Next.js API routes. Credentials and auth tokens are never exposed to the browser.

5. **The backend/API layer owns:** authentication, authorization, input validation, concurrency control, audit trails, and SAP/ERP integration. These concerns must not leak into the frontend.

6. **Adapter contract:** To add a new data source, create a new adapter file (e.g. `src/services/sapOdataService.ts`) implementing the same method signatures as `mockErpService.ts`, then wire it into `procurementDataService.ts`. No frontend or API route code should change.

See: `docs/INTEGRATION_CONTRACT.md` for the full architecture contract.

---

## 🚦 API Route Import Rule

Introduced in **Phase 6A: Read-Path Migration Complete**.

1. **API routes must not directly import csvDataService.** `app/api/` routes must only import from `procurementDataService`. Direct imports of `csvDataService` inside `app/api/` are a bug, not a pattern to follow.

2. **mockErpService is the only current adapter allowed to call csvDataService.** The chain is: `API route → procurementDataService → mockErpService → csvDataService`. No route skips the service layer.

3. **csvDataService is now treated as a temporary mock-data implementation detail.** It is not a public API. It must not be imported outside of `mockErpService.ts`. Future AI sessions must not add new direct imports of csvDataService in API routes or frontend components.

4. **Exception: disabled-module routes.** The API routes for disabled modules (agents, reminders, monitoring, control-tower, part-availability, exception-analytics, buyer-productivity, recommendations, copilot) still import csvDataService directly. They are excluded from Phase 6A scope and will be migrated when the modules are re-enabled or replaced.

---

## 📋 Action Layer Design Principles

Introduced in **Phase 6B: Action Layer Design**.

1. **Cache is for visibility. SAP is for truth. Live validation is for action.** Dashboards read from local cache. Before any action that writes to or reflects SAP data, the app must perform a live SAP read to validate current state.

2. **SAP owns official PO data.** The app must never update PO headers, PO items, schedule lines, supplier master, official delivery dates, official quantities, official prices, or official acknowledgement records. These are SAP-owned and read-only from the app's perspective.

3. **The app may own buyer workflow state.** Follow-up notes, escalation flags, supplier contacted flags, assigned owners, reminder dates, internal risk classifications, review status, and follow-up action records are app-owned. These are safe to implement without SAP write integration.

4. **No full SAP table loads.** SAP integration must use initial scoped load + delta refresh. Full table polling is prohibited.

5. **Write actions require concurrency control.** Every editable action row must have a `version` field. Optimistic concurrency must be checked on every write. Conflicts must return a 409 and surface a clear user-visible message.

6. **Every write must produce an audit log entry.** No silent writes. Full audit trail is required for compliance.

See: `docs/ACTION_LAYER_DESIGN.md` for the full design document.

---

## ✍️ App-Owned Action Layer Rules

Introduced in **Phase 7A: App-Owned Action Layer (Local First)**.

1. **App-owned workflow data is separate from SAP-owned procurement data.** ERP fields (PO quantities, delivery dates, prices, supplier master, official acknowledgements) are read-only. The app creates and owns only buyer workflow data: notes, flags, review status, escalations, reminders, and action history.

2. **SAP-owned PO fields must not be modified.** Phase 7A writes zero bytes to any CSV file, SAP system, or ERP integration. If future code attempts to update a SAP-owned field (quantity, price, date, official status), it is a bug and must be rejected in code review.

3. **All app-owned action writes must go through `procurementActionService.ts`.** No API route should call `mockActionStore` directly. No frontend component should call action APIs that bypass this service. The service enforces business validation and concurrency rules.

4. **`mockActionStore.ts` is temporary and replaceable.** It is the Phase 7A persistence implementation only. It must not be referenced outside of `procurementActionService.ts`. Replacing it in Phase 8 requires only changing one import in `procurementActionService.ts`.

5. **Optimistic concurrency is required for all app-owned action updates.** Every `PATCH` request must include `expectedVersion`. If the stored version does not match, return `409 Conflict`. Never silently overwrite. The `version` field must be incremented on every successful update.

6. **SAP write-back is explicitly out of scope until Phase 9.** Do not add any SAP write logic, SAP OData PATCH calls, or ERP update methods in Phase 7A or 7B. Any such additions are a scope violation.

7. **Azure SQL / Supabase is not part of Phase 7A.** The local JSON store in `data/app-actions.json` is the intentional Phase 7A persistence mechanism. Do not provision external databases until Phase 8 is explicitly approved.

8. **`procurementActionService.ts` must not import `csvDataService`.** The action service owns only app workflow data. Importing the ERP data source would violate the separation boundary.

9. **Action API routes (`/api/actions/...`) must not import `csvDataService`.** These routes use only `procurementActionService`. They must not read or write ERP data.

10. **The `actions` field on `GET /api/po-overdue/detail` is additive and non-breaking.** Existing frontend components that don't read `actions` are unaffected. Future drawer components may read it to show buyer action history alongside ERP detail.

See: `docs/APP_OWNED_ACTION_LAYER.md` for the full implementation document.

---

## 💡 Recommendation Lifecycle Principles

Introduced in **Phase 8A: Recommendation Lifecycle Design**.

1. **Milestone 1 Complete:** Milestone 1 (Local Buyer Workflow Beta) is successfully complete. Buyers can log notes, record supplier contact, escalate actions, and handle optimistic concurrency errors locally.

2. **Recommendation-and-Verification Workbench:** The application is a recommendation-and-verification workbench. It does not directly mutate SAP/source PO quantity, delivery date, price, or acknowledgement fields.

3. **Buyer Manually Updates SAP:** The buyer must manually execute the recommended updates directly inside SAP.

4. **Verification Post-Sync:** The app's verification engine checks the source data after the next data sync to confirm whether the manual updates occurred. If they match the expected target values, the recommendation is marked as verified and auto-closed.

5. **Separation of Concerns:** Recommendations (system-generated multi-step state-machines) are separate from ProcurementActions (manually recorded simple notes or log entries), though a recommendation might spawn actions during its lifecycle.

---

## 📦 Recommendation Backend Rules (Phase 8B)

Introduced in **Phase 8B: Backend Recommendation Lifecycle Setup**.

1. **Backend-Only Scope:** Phase 8B implements backend mock recommendation lifecycle only. No frontend UI is introduced.

2. **Store Separation:** Recommendations are stored strictly in `data/app-recommendations.json` (handled by `mockRecommendationStore.ts`) separate from ProcurementActions (`data/app-actions.json`).

3. **No SAP Mutations:** Recommendations do not write to or mutate SAP or source CSV files. Source PO fields are read-only.

4. **Single Write Interface:** `recommendationService.ts` is the single allowed business logic service through which all recommendation writes and updates must pass.

5. **Optimistic Concurrency Control:** Every recommendation update/transition requires an `expectedVersion` version matching check. Stale writes are blocked and return HTTP 409 Conflict.

6. **Store Replaceability:** `mockRecommendationStore.ts` is temporary and replaceable. In future phases, replacing it with a SQL database adapter requires editing only `recommendationService.ts`.

---

## 📬 Supplier Communications Rules (Phase 8C)

Introduced in **Phase 8C: Supplier Reminder & Response Mock Capture**.

1. **App-Owned Communication Store:** Reminder and response records are app-owned and stored in `data/app-supplier-reminders.json` and `data/app-supplier-responses.json`.
2. **Zero Forbidden Imports:** Services/routes in this domain must not import `csvDataService` or `procurementDataService`.
3. **No External Integrations:** SMTP, Gmail, Outlook, n8n, or SAP write-back are strictly out of scope.

---

## 🧠 Supplier Response Interpretation Rules (Phase 8D)

Introduced in **Phase 8D: Response Interpretation Rules**.

1. **Local Heuristic Interpretation:** Classification of supplier responses into categories (such as `ACCEPTED_AS_IS`, `DELIVERY_DATE_CHANGED`, etc.) must be done using local rule-based regex and keyword heuristics. No external AI/LLM API calls.
2. **Recommendation Transitions:** Interpreting a response transitions the linked recommendation according to the designated category mapping.
3. **Date and Entity Extraction:** Dates must be parsed from text and standardized to `YYYY-MM-DD`. Quantities and prices must be extracted using heuristics.
4. **Safer Defaults:** `ACCEPTED_AS_IS` transitions the recommendation directly to `VERIFICATION_PENDING` (no buyer manual SAP update required by default).

---

## 🔍 Verification Engine Rules (Phase 8E)

Introduced in **Phase 8E: Verification Engine**.

1. **Verify Post-Sync:** The verification engine runs post-sync to check if expected values (`expectedValueAfterSync`) for delivery dates, quantities, and acknowledgements have been resolved in the source procurement data.
2. **Read-Only ERP Queries:** All verification reads go through `procurementDataService` boundary. There must be no direct `csvDataService` imports in the verification service or verification routes.
3. **App-Owned Recommendation Updates Only:** The verification engine writes only to recommendation store via `recommendationService.ts`. It never mutates SAP or source CSV files.
4. **Supported Outcomes:** The engine checks for outcomes: `PASSED`, `FAILED`, `PARTIAL_MATCH`, `SOURCE_CHANGED_DIFFERENTLY`, `PO_CLOSED_OR_CANCELLED`, `SOURCE_RECORD_NOT_FOUND`.
5. **Lifecycle Transitions:**
   - `PASSED` ➔ `CONFIRMED_RESOLVED` (owner: `NONE`, verificationStatus: `PASSED`)
   - `FAILED` ➔ stays open and buyer-owned (transitions/stays in `PENDING_BUYER_ACTION`, verificationStatus: `FAILED`)
   - `PARTIAL_MATCH` ➔ `PENDING_BUYER_ACTION` (owner: `BUYER`, verificationStatus: `FAILED`)
   - `SOURCE_CHANGED_DIFFERENTLY` ➔ `PENDING_BUYER_ACTION` (owner: `BUYER`, verificationStatus: `FAILED`)
   - `PO_CLOSED_OR_CANCELLED` ➔ `CLOSED_NO_ACTION` (owner: `NONE`, verificationStatus: `MANUALLY_CLOSED`)
   - `SOURCE_RECORD_NOT_FOUND` ➔ `BLOCKED` (owner: `BUYER`, verificationStatus: `FAILED`)
6. **Optimistic Concurrency Control:** Concurrency versions must be checked and incremented when updating recommendation fields during verification.
7. **ERP Sync Hook:** The `POST /api/control-tower/sync-erp` route triggers `verifyOpenRecommendationsAfterSync()` on successful sync.

---

## 🚦 Feature Freeze Rule (Active)

The app is now in **single-user MVP validation mode**.

No new feature development should be performed unless the user explicitly writes the exact phrase:

**I AGREE TO THE RISKS AND WANT TO PROCEED FORWARD**

Until that phrase is provided, the agent must stop and warn the user if they ask for any new feature. Refer to the complete governance guidelines in [project-governance-feature-freeze.md](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/docs/project-governance-feature-freeze.md).

### Allowed Work During Freeze:
*   Bug, calculation, or business logic fixes.
*   Test case or data reconciliation fixes.
*   Documentation, manual testing guide, or checklist updates.

### Blocked Work During Freeze:
*   New dashboard cards, pages, charts, or integrations.
*   New AI/LLM/Copilot features.
*   Real email sending, multi-user, or DB migrations.

### Required Agent Response to Feature Requests:
> “Feature freeze is active. This request appears to be new feature development. Current allowed work is limited to bug fixes, test fixes, reconciliation fixes, and documentation/testing improvements. To proceed with this feature, please explicitly confirm: I AGREE TO THE RISKS AND WANT TO PROCEED FORWARD.”
