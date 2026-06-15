# Recommendation Lifecycle Design — Aalok Sidekick

This document details the product direction, architecture, and data structures for the **Recommendation Lifecycle** in **Aalok Sidekick**. 

---

## 1. Product Purpose & Philosophy

Aalok Sidekick operates strictly as a **recommendation-and-verification workbench**, and is **not** the system of record for procurement transactions. It does not perform write-backs or direct mutations to SAP or the core procurement database.

### Core Philosophy: "Recommend, Do Not Mutate. Verify After Sync."
1. **Source Immutability:** SAP (or the ERP source data) is the absolute system of record. PO quantities, delivery dates, prices, and acknowledgement records cannot be edited directly by the application.
2. **Action Guidance:** The app detects issues, suggests targeted actions, facilitates communication logs, tracks supplier commitments, and proposes manual updates for the buyer to perform in SAP.
3. **Closing the Loop via Verification:** After a buyer manually applies updates in SAP and a subsequent system sync occurs, Aalok Sidekick compares the new source data against the recommended target values. If they match, the recommendation is automatically verified and resolved. If they do not, it remains open for further follow-up.

```mermaid
flowchart TD
    Detect["1. Detect Procurement Issue"] --> Recommend["2. Generate Recommendation"]
    Recommend --> Remind["3. Send/Record Supplier Reminder"]
    Remind --> Response["4. Capture & Interpret Supplier Response"]
    Response --> Propose["5. Propose Manual SAP Update"]
    Propose --> Manual["6. Buyer Manually Updates SAP"]
    Manual --> Sync["7. Next Source/SAP Data Sync"]
    Sync --> Verify{"8. Does Source Match Expected?"}
    Verify -- Yes -- > Close["9. Auto-Close (Verified)"]
    Verify -- No -- > Open["10. Remain Open (Requires Attention)"]
```

---

## 2. Lifecycle Overview

The recommendation lifecycle flows through the following stages:

1. **Issue Detected:** An exception (e.g., overdue schedule line, missing acknowledgement) is identified in source procurement data calculations.
2. **Recommendation Created:** The app generates a tailored recommendation action item (e.g. `SEND_SUPPLIER_REMINDER`).
3. **Pending Buyer Action:** Staged and visible to the buyer.
4. **Reminder Sent or Recorded:** Buyer logs contact or triggers a simulated reminder.
5. **Pending Supplier Response:** Awaiting supplier reply.
6. **Supplier Response Received:** Supplier response is recorded.
7. **Response Interpreted:** Categorized (e.g., `DELIVERY_DATE_CHANGED`) with a proposed resolution path.
8. **Buyer SAP Update Recommended:** Proposes the exact change the buyer must make in SAP.
9. **Buyer Manually Updates SAP:** The buyer modifies the record in SAP outside the app.
10. **Verification Pending:** Waiting for the next ERP/source sync.
11. **Next Source Sync:** New source CSV/OData data is imported.
12. **Verification Pass/Fail:** Verification engine compares source data with expected values.
13. **Confirmed Resolved / Remains Open:** If verification passes, the status changes to `CONFIRMED_RESOLVED`. Otherwise, it reverts/remains open.

---

## 3. Recommended Lifecycle Statuses

Below is the state transition model for recommendations:

| Status | Meaning | Next Step Owner | Allowed Transitions | Example Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **RECOMMENDED** | System has drafted a recommendation; waiting for buyer to review/confirm. | Buyer | `PENDING_BUYER_ACTION`, `CLOSED_NO_ACTION` | Overdue PO line is detected. App recommends sending a reminder to the supplier. |
| **PENDING_BUYER_ACTION** | Recommendation is approved; buyer needs to initiate contact/send reminder. | Buyer | `PENDING_SUPPLIER_RESPONSE`, `CLOSED_NO_ACTION`, `ESCALATED`, `BLOCKED` | Buyer reviews the recommendation and initiates the email/contact workflow. |
| **PENDING_SUPPLIER_RESPONSE** | A reminder has been recorded; waiting for the supplier to respond. | Supplier | `SUPPLIER_RESPONDED`, `ESCALATED`, `BLOCKED`, `PENDING_BUYER_ACTION` | Buyer records that an email was sent. The app waits for the supplier's commitment. |
| **SUPPLIER_RESPONDED** | The supplier sent a response (email, portal input, or text). | Buyer | `PENDING_BUYER_SAP_UPDATE`, `CLOSED_NO_ACTION`, `PENDING_SUPPLIER_RESPONSE` | Supplier replies: "Will ship on June 15." |
| **PENDING_BUYER_SAP_UPDATE** | Supplier response is interpreted, and a manual SAP change is recommended. | Buyer | `VERIFICATION_PENDING`, `CLOSED_NO_ACTION`, `PENDING_BUYER_ACTION` | Buyer is instructed: "Manually change delivery date in SAP to 2026-06-15." |
| **VERIFICATION_PENDING** | Buyer has marked the SAP update complete; waiting for the next data sync to verify. | System | `CONFIRMED_RESOLVED`, `PENDING_BUYER_SAP_UPDATE`, `ESCALATED` | Buyer clicks "I updated SAP". System sets status to verification pending. |
| **CONFIRMED_RESOLVED** | (Terminal) Next sync verified the expected data update in the source CSV/OData feed. | None | *None (Terminal)* | Sync detects the PO delivery date is now `2026-06-15`. Recommendation auto-closes. |
| **CLOSED_NO_ACTION** | (Terminal) Buyer closed the recommendation without updating SAP (e.g. invalid alert). | None | *None (Terminal)* | Buyer reviews and closes as "No action required: supplier already shipped." |
| **ESCALATED** | Action has breached SLA or supplier refused to comply; escalated internally. | Buyer / Manager | `PENDING_BUYER_ACTION`, `CLOSED_NO_ACTION`, `BLOCKED` | Supplier refuses to expedite; buyer escalates internally. |
| **BLOCKED** | Action is stuck due to dependency (e.g. engineering change, credit hold). | Buyer | `PENDING_BUYER_ACTION`, `CLOSED_NO_ACTION`, `ESCALATED` | Credit hold on vendor prevents rescheduling. |

---

## 4. Recommendation Types

The system classifies recommendations into the following actions based on issue types:

* **SEND_SUPPLIER_REMINDER:** Draft an overdue reminder to prompt the supplier for status.
* **REQUEST_ACKNOWLEDGEMENT:** Request formal acknowledgement on a newly issued PO line.
* **REQUEST_DELIVERY_CONFIRMATION:** Query status on a PO line approaching its delivery date.
* **REVIEW_SUPPLIER_DATE_CHANGE:** Evaluate a date reschedule request submitted by the supplier.
* **REVIEW_SUPPLIER_QTY_CHANGE:** Evaluate a quantity change request submitted by the supplier.
* **REVIEW_SUPPLIER_PRICE_ISSUE:** Resolve a unit price dispute raised by the supplier.
* **UPDATE_SAP_DELIVERY_DATE_MANUALLY:** Instruct the buyer to manually shift the delivery date in SAP.
* **UPDATE_SAP_QUANTITY_MANUALLY:** Instruct the buyer to manually modify the PO quantity in SAP.
* **ESCALATE_SUPPLIER:** Direct the buyer to start hot-list/critical path vendor escalation.
* **NO_ACTION_REQUIRED:** The system determines no intervention is currently needed.

---

## 5. Supplier Response Interpretation Categories

When a supplier responds, their feedback is classified into one of the following categories to drive the next steps:

| Response Category | Example Supplier Text | Recommended Buyer Action | SAP Manual Update Needed? | Verification Rule |
| :--- | :--- | :--- | :--- | :--- |
| **ACCEPTED_AS_IS** | "We accept the PO details and delivery date." | None / Record commitment. | No (unless clearing missing ACK flag). | Verify `confirmation_control_key` or `acknowledgement_status` is updated. |
| **DELIVERY_DATE_CHANGED** | "Cannot make June 10; we will deliver on June 18." | Verify feasibility, then update SAP Delivery Date manually. | **Yes** (to new date). | Verify new delivery date in source matches `2026-06-18`. |
| **QUANTITY_CHANGED** | "We can only supply 250 of the requested 500 units." | Split schedule line or adjust PO quantity in SAP manually. | **Yes** (to new qty). | Verify order quantity in source matches `250`. |
| **PRICE_ISSUE** | "Price on PO is $12.50, but our quote is $13.00." | Review purchasing info record; update SAP PO price manually. | **Yes** (to new price). | Verify price in source matches `$13.00`. |
| **REJECTED** | "We cannot fulfill this line. Please cancel." | Cancel PO item manually in SAP. | **Yes** (delete/delete flag). | Verify line item is marked as cancelled/deleted in source. |
| **PARTIAL_CONFIRMATION** | "Shipping 100 on June 10 and 200 on June 20." | Split schedules manually in SAP to align with delivery batches. | **Yes** (split lines). | Verify source contains two schedules matching the split dates/quantities. |
| **NEEDS_CLARIFICATION** | "Do you require special packaging?" | Respond to supplier query. | No. | Reverts to `PENDING_BUYER_ACTION` (manual close or follow-up). |
| **WRONG_CONTACT** | "John no longer handles this. Contact sales@supplier.com." | Update local contact logs. | No. | Reverts to `PENDING_BUYER_ACTION` to resend to updated contact. |
| **OUT_OF_OFFICE** | "I am out of the office until next week." | Wait or contact alternate. | No. | Re-evaluate after out-of-office period expires. |
| **NO_RESPONSE** | *(No response received within SLA)* | Escalate internally or resend reminder. | No. | Trigger escalation status. |
| **FREE_TEXT_UNCLEAR** | "Please refer to attached manifest." | Read attachment and manually classify. | Case-by-case. | Reverts to manual classification by buyer. |

---

## 6. Verification Logic

Following a data sync, the verification engine runs automated checks to determine if the manual buyer updates in SAP have occurred.

### A. Delivery Date Change Verification
* **Precondition:** `recommendedSapField = 'delivery_date'`, `expectedValueAfterSync = '2026-06-18'`.
* **Sync Rule:** Select the schedule line in the newly synced source data.
* **Evaluation:**
  * If `source.delivery_date === expectedValueAfterSync`, update status to `CONFIRMED_RESOLVED` and write a successful verification message.
  * If mismatch, keep status as `PENDING_BUYER_SAP_UPDATE` or `VERIFICATION_PENDING` (increment retry counters or flag discrepancy).

### B. Quantity Change Verification
* **Precondition:** `recommendedSapField = 'scheduled_qty'`, `expectedValueAfterSync = '250'`.
* **Sync Rule:** Select the schedule line in the newly synced source data.
* **Evaluation:**
  * If `source.scheduled_qty === expectedValueAfterSync`, update status to `CONFIRMED_RESOLVED`.
  * If mismatch, remain open.

### C. Acknowledgement Received Verification
* **Precondition:** `recommendationType = 'REQUEST_ACKNOWLEDGEMENT'`.
* **Sync Rule:** Inspect the newly synced schedule line or acknowledgement table.
* **Evaluation:**
  * If `source.acknowledgement_status === 'ACKNOWLEDGED'` or `source.confirmed_date` is populated, update status to `CONFIRMED_RESOLVED`.
  * If status remains `MISSING`, remain `PENDING_SUPPLIER_RESPONSE` or alert.

### D. No Action Required / Manual Resolution
* **Sync Rule:** No automated verification available (e.g. verbal clarification).
* **Evaluation:**
  * Buyer manually closes the recommendation via the workbench UI, setting status to `CLOSED_NO_ACTION` and selecting a closure reason (e.g. `RESOLVED_VERBALLY`).

---

## 7. Proposed Recommendation Data Model

The proposed TypeScript interface for the `Recommendation` entity is designed as follows:

```typescript
export interface Recommendation {
  recommendationId: string;        // Unique UUID
  sourceModule: 'OVERDUE_WORKBENCH' | 'ACKNOWLEDGEMENT_WORKLIST' | 'SUPPLIER_PERFORMANCE';
  purchaseOrderNumber: string;     // SAP PO Number
  purchaseOrderItem: string;       // SAP PO Item
  supplierId: string;              // SAP Vendor ID
  supplierName: string;            // Vendor Name
  recommendationType:
    | 'SEND_SUPPLIER_REMINDER'
    | 'REQUEST_ACKNOWLEDGEMENT'
    | 'REQUEST_DELIVERY_CONFIRMATION'
    | 'REVIEW_SUPPLIER_DATE_CHANGE'
    | 'REVIEW_SUPPLIER_QTY_CHANGE'
    | 'REVIEW_SUPPLIER_PRICE_ISSUE'
    | 'UPDATE_SAP_DELIVERY_DATE_MANUALLY'
    | 'UPDATE_SAP_QUANTITY_MANUALLY'
    | 'ESCALATE_SUPPLIER'
    | 'NO_ACTION_REQUIRED';
  lifecycleStatus:
    | 'RECOMMENDED'
    | 'PENDING_BUYER_ACTION'
    | 'PENDING_SUPPLIER_RESPONSE'
    | 'SUPPLIER_RESPONDED'
    | 'PENDING_BUYER_SAP_UPDATE'
    | 'VERIFICATION_PENDING'
    | 'CONFIRMED_RESOLVED'
    | 'CLOSED_NO_ACTION'
    | 'ESCALATED'
    | 'BLOCKED';
  currentOwner: string;            // Buyer username
  issueDetectedAt: string;         // ISO timestamp
  issueReason: string;             // E.g., "Schedule line is 5 days overdue"
  recommendedActionText: string;   // User-facing description
  supplierReminderId?: string;     // Foreign key to reminder logs
  supplierResponseId?: string;     // Foreign key to response logs
  responseCategory?:
    | 'ACCEPTED_AS_IS'
    | 'DELIVERY_DATE_CHANGED'
    | 'QUANTITY_CHANGED'
    | 'PRICE_ISSUE'
    | 'REJECTED'
    | 'PARTIAL_CONFIRMATION'
    | 'NEEDS_CLARIFICATION'
    | 'WRONG_CONTACT'
    | 'OUT_OF_OFFICE'
    | 'NO_RESPONSE'
    | 'FREE_TEXT_UNCLEAR';
  interpretedSummary?: string;     // AI/Rule output summary of supplier feedback
  recommendedSapField?: string;    // 'delivery_date', 'scheduled_qty', 'net_price'
  recommendedSapValue?: string;    // Target value (string representation)
  verificationField?: string;      // Field in source data to check
  expectedValueAfterSync?: string; // Target value expected in next sync
  lastVerifiedAt?: string;         // ISO timestamp of last evaluation
  verificationStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  verificationMessage?: string;    // E.g., "Verified: Delivery date changed to 2026-06-18 in SAP."
  createdBy: string;               // Creator identity (system or username)
  createdAt: string;               // ISO timestamp
  updatedBy: string;               // Identity of last modifier
  updatedAt: string;               // ISO timestamp
  version: number;                 // For optimistic concurrency control
  closedAt?: string;               // ISO timestamp
  closureReason?: string;          // E.g. "RESOLVED_IN_SAP", "CLOSED_DUPLICATE"
}
```

---

## 8. Relationship with Existing Action Layer

Aalok Sidekick already has an **App-Owned Action Layer** (using `ProcurementAction` and `procurementActionService.ts`). The table below outlines how `Recommendation` integrates with, but remains distinct from, `ProcurementAction`:

| Feature | ProcurementAction (Existing) | Recommendation (Proposed) |
| :--- | :--- | :--- |
| **Concept** | A simple log of user actions (notes, email tags, internal completions). | A structured state-machine representing a business issue lifecycle. |
| **Origin** | Created manually by the buyer (e.g. typing a note). | Created by the system (issue detection) or drafted by agents. |
| **Complexity** | Low. Linear timeline log. | High. Multi-step state transitions and automated verification logic. |
| **Verification** | None. Completed when the buyer flags it as complete. | Automated. Verifies source data changes after next sync. |
| **Relationship** | A Recommendation can *spawn* a `ProcurementAction` (e.g., sending a reminder logs a `SUPPLIER_CONTACTED` action). | A `ProcurementAction` represents a single action item within a broader Recommendation. |

---

## 9. Ownership Boundaries

To guarantee system stability, the boundary of what data is owned by Aalok Sidekick versus what is owned by the SAP ERP remains strictly separated:

* **Aalok Sidekick (App-Owned):**
  * Recommendation lifecycle state (`RECOMMENDED`, `PENDING_BUYER_SAP_UPDATE`, etc.)
  * Supplier reminder transmission records (logs, draft templates)
  * Supplier response records (captured email/portal texts)
  * LLM/rule interpretation metadata and response categories
  * Suggested SAP update details (proposed target field and target value)
  * Verification status, timestamps, and history log
  * Internal notes and workflow ownership assignment

* **SAP / ERP Core (Source-Owned / Read-Only):**
  * Purchase order numbers, item numbers, and schedule lines
  * Official delivery dates (`delivery_date`)
  * Official quantities (`scheduled_qty`, `received_qty`, `open_qty`)
  * Official unit prices and line values
  * Official confirmation controls and acknowledgement status
  * Supplier vendor master info (addresses, official names)

---

## 10. Explicitly Out of Scope

To prevent security vulnerabilities, architectural bloat, and scope leak, the following items are strictly out of scope:

1. **Automatic SAP Update:** No automated write-backs or API calls to change SAP-owned fields.
2. **Automatic SAP Acknowledgement Posting:** No automated portal acknowledgement submissions.
3. **App-Driven Quantity/Date Changes:** The app never updates schedule line dates or open quantities.
4. **Supplier Master Updates:** No ability to modify vendor names or contact profiles.
5. **Real Email Transmission:** Email clients and mail servers are mock-only; no actual messages are dispatched.
6. **Azure/External DB Provisioning:** Supabase, Azure SQL, or AWS RDS provisioning is excluded from this design phase.
7. **Production Authentication:** Complete role-based active directory or SSO integration.
8. **Complex Approval Workflows:** Dual-authorization or supervisor approval queues.
9. **AI/LLM API Integrations:** Real-time OpenAI, Gemini, or Claude integrations for response interpretation.

---

## 11. Future Implementation Phases

We recommend implementing the recommendation lifecycle incrementally across the following phases:

* **Phase 8B (Backend Lifecycle Setup) — [IMPLEMENTED]:**
  - **Types:** Defined recommendation TypeScript types in [procurementRecommendations.ts](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/src/types/procurementRecommendations.ts).
  - **Store:** Created [mockRecommendationStore.ts](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/src/services/mockRecommendationStore.ts) using local JSON persistence in `data/app-recommendations.json` with synchronous file flushing and thread-safe Maps.
  - **Service:** Implemented [recommendationService.ts](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/src/services/recommendationService.ts) for service-level abstraction, fully decoupled from raw CSV files.
  - **API Routes:** Implemented Next.js routes supporting filtered queries (`GET /api/recommendations`), details (`GET /api/recommendations/[id]`), updates (`PATCH /api/recommendations/[id]`), status transitions (`POST /api/recommendations/[id]/transition`), action linking (`POST /api/recommendations/[id]/link-action`), PO line querying (`GET /api/recommendations/po-line`), and supplier querying (`GET /api/recommendations/supplier`).
  - **Optimistic Concurrency:** Validates matching `expectedVersion` headers/body fields against stored version, incrementing version numbers on write success and returning HTTP 409 Conflict on version mismatches.
  - **Seed Data:** Setup baseline seed cases in `data/app-recommendations.json` mapping to PO `4500000437`.

* **Phase 8C (Supplier Reminder & Response Mocking):**
  - Create endpoints for recording reminders sent (`POST /api/recommendations/reminder`).
  - Create mock forms or endpoint mocks to record supplier replies (`POST /api/recommendations/response`).

* **Phase 8D (Response Interpretation Rules):**
  - Add parsing logic that automatically classifies incoming supplier response text into a `ResponseCategory`.
  - Initially implement simple rule-based heuristics or manual drop-down overrides.

* **Phase 8E (Verification Engine):**
  - Build the verification scheduler or sync hook.
  - When `/api/control-tower/sync-erp` is triggered, process all `VERIFICATION_PENDING` recommendations.
  - Compare the new CSV data to `expectedValueAfterSync` and transition matching ones to `CONFIRMED_RESOLVED`.

* **Phase 8F (Drawer & Workbench UI Integration):**
  - Update the PO overdue detail drawer to display the recommendation card, status badges, and action buttons.
  - Add buttons like "I updated SAP manually" to advance recommendation to `VERIFICATION_PENDING`.
