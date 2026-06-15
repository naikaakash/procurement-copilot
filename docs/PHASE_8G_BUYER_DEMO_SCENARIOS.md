# Phase 8G: End-to-End Buyer Demo Scenarios & Seed Data

This document provides a guide for validating the **Recommendation Worklist UI** and the underlying recommendation lifecycle backend using a curated mock dataset.

---

## Curated Demo Scenarios

### Scenario 1: New Overdue PO Needing Supplier Contact
*   **PO / Item / Line**: `4500000437` / `00030` / `0001`
*   **Supplier**: `Test Supplier` (`VEND-001`)
*   **Issue Type**: Overdue PO Line without confirmed recovery date
*   **Recommendation Type**: `SEND_SUPPLIER_REMINDER`
*   **Lifecycle Status**: `RECOMMENDED`
*   **Current Owner**: `BUYER`
*   **Verification Status**: `NOT_READY`
*   **What the Buyer Sees**: An active recommendation card/row in the "All Open" tab prompting them to send a reminder email mock.
*   **Buyer Action**: Click the row to open the details panel. From the Overdue PO Workbench drawer, send a reminder to the supplier.
*   **Expected Result**: Creating/sending the reminder transitions the recommendation to `PENDING_SUPPLIER_RESPONSE` and changes the owner to `SUPPLIER`.
*   **Verification Outcome**: Verification stays pending (cannot verify without supplier response).

### Scenario 2: Pending Supplier Response
*   **PO / Item / Line**: `4500000437` / `00010` / `0001`
*   **Supplier**: `Test Supplier` (`VEND-001`)
*   **Issue Type**: Overdue PO Line with reminder sent
*   **Recommendation Type**: `REQUEST_ACKNOWLEDGEMENT`
*   **Lifecycle Status**: `PENDING_SUPPLIER_RESPONSE`
*   **Current Owner**: `SUPPLIER`
*   **Verification Status**: `NOT_READY`
*   **What the Buyer Sees**: The card in the "Pending Supplier Response" tab showing a logged reminder sent to the supplier.
*   **Buyer Action**: Awaiting supplier response. (The buyer can inspect reminder history but cannot trigger manual updates yet).
*   **Expected Result**: Mock capture of supplier email response transitions this to `SUPPLIER_RESPONDED`.
*   **Verification Outcome**: Verification is not ready.

### Scenario 3: Supplier Responded with Delivery Date Change
*   **PO / Item / Line**: `4500000437` / `00020` / `0001`
*   **Supplier**: `Test Supplier` (`VEND-001`)
*   **Issue Type**: Supplier proposed new recovery date `2026-06-18` (original overdue date `2026-03-26`)
*   **Recommendation Type**: `UPDATE_SAP_DELIVERY_DATE_MANUALLY`
*   **Lifecycle Status**: `SUPPLIER_RESPONDED`
*   **Current Owner**: `BUYER`
*   **Verification Status**: `NOT_READY`
*   **What the Buyer Sees**: Renders in the "Supplier Responded" tab. The details drawer displays the interpreted response summary: *"Supplier email: 'Due to production delay, delivery is shifted to June 18.'"* and proposed expected value after sync: `2026-06-18`.
*   **Buyer Action**: Review the proposal. If acceptable, buyer manually updates SAP and clicks "Confirm manual SAP action completed".
*   **Expected Result**: Transitions status to `PENDING_BUYER_SAP_UPDATE` or `VERIFICATION_PENDING`.
*   **Verification Outcome**: Stays pending until next ERP sync.

### Scenario 4: Supplier Responded with Quantity Change
*   **PO / Item / Line**: `4500000437` / `00040` / `0001`
*   **Supplier**: `Test Supplier` (`VEND-001`)
*   **Issue Type**: Supplier proposed quantity reduction to `500` (original `1000`) due to supply shortage
*   **Recommendation Type**: `UPDATE_SAP_QUANTITY_MANUALLY`
*   **Lifecycle Status**: `SUPPLIER_RESPONDED`
*   **Current Owner**: `BUYER`
*   **Verification Status**: `NOT_READY`
*   **What the Buyer Sees**: Renders in the "Supplier Responded" tab. Detail drawer displays interpreted response: *"Supplier email: 'Material shortage. We can only deliver 500 units instead of 1000.'"* and proposed expected value: `500`.
*   **Buyer Action**: Review the quantity change. Once manually performed, buyer transitions it.
*   **Expected Result**: Transitions status to `PENDING_BUYER_SAP_UPDATE` or `VERIFICATION_PENDING`.
*   **Verification Outcome**: Stays pending.

### Scenario 5: Buyer Manual SAP Update Pending
*   **PO / Item / Line**: `4500000302` / `00020` / `0001`
*   **Supplier**: `Nexus Components` (`S100009`)
*   **Issue Type**: Awaiting manual buyer SAP date update to `2026-03-15`
*   **Recommendation Type**: `UPDATE_SAP_DELIVERY_DATE_MANUALLY`
*   **Lifecycle Status**: `PENDING_BUYER_SAP_UPDATE`
*   **Current Owner**: `BUYER`
*   **Verification Status**: `PENDING_NEXT_SYNC`
*   **Expected Value**: `2026-03-15`
*   **What the Buyer Sees**: Renders in the "Pending SAP Update" tab. Displays active button: **"Confirm manual SAP action completed"**.
*   **Buyer Action**: Buyer performs manual ERP update. Click the confirmation button.
*   **Expected Result**: Recommendation transitions to `VERIFICATION_PENDING` and owner changes to `SOURCE_SYSTEM`.
*   **Verification Outcome**: Awaiting next source sync.

### Scenario 6: Verification Pending After Buyer Action
*   **PO / Item / Line**: `4500000302` / `00020` / `0001`
*   **Supplier**: `Nexus Components` (`S100009`)
*   **Issue Type**: Manual action confirmed, awaiting ERP sync check
*   **Recommendation Type**: `UPDATE_SAP_DELIVERY_DATE_MANUALLY`
*   **Lifecycle Status**: `VERIFICATION_PENDING`
*   **Current Owner**: `SOURCE_SYSTEM`
*   **Verification Status**: `PENDING_NEXT_SYNC`
*   **Expected Value**: `2026-03-15`
*   **What the Buyer Sees**: Renders in the "Verification Pending" tab. Exposes the action button: **"Verify Now"**.
*   **Buyer Action**: Trigger immediate verification using "Verify Now" (or run ERP Sync from Control Tower).
*   **Expected Result**: The verification engine queries the mock ERP data for `PO 4500000302 Item 00020`, finds delivery date `2026-03-15`, matches it to the expected value, transitions recommendation to `CONFIRMED_RESOLVED`, sets verification status to `PASSED`, and closes the case.
*   **Verification Outcome**: **PASSES** and transitions to `CONFIRMED_RESOLVED`.

### Scenario 7: Confirmed Resolved After Source Refresh
*   **PO / Item / Line**: `4500000302` / `00020` / `0001`
*   **Supplier**: `Nexus Components` (`S100009`)
*   **Issue Type**: Date update successfully verified in ERP
*   **Recommendation Type**: `UPDATE_SAP_DELIVERY_DATE_MANUALLY`
*   **Lifecycle Status**: `CONFIRMED_RESOLVED`
*   **Current Owner**: `NONE`
*   **Verification Status**: `PASSED`
*   **Expected Value**: `2026-03-15`
*   **What the Buyer Sees**: Renders in the "Resolved / Closed" tab. Displays lock label: *"🔒 Closed history is read-only"*.
*   **Buyer Action**: None (Historical logging).
*   **Expected Result**: Read-only log context.
*   **Verification Outcome**: Verified.

### Scenario 8: Escalated or Blocked Supplier Case
*   **PO / Item / Line**: `4500000437` / `00040` / `0001`
*   **Supplier**: `Test Supplier` (`VEND-001`)
*   **Issue Type**: Supplier rejected PO or indicates wrong contact
*   **Recommendation Type**: `ESCALATE_SUPPLIER`
*   **Lifecycle Status**: `ESCALATED` (or `BLOCKED`)
*   **Current Owner**: `BUYER`
*   **Verification Status**: `NOT_READY` or `FAILED`
*   **What the Buyer Sees**: Renders in the "Escalated / Blocked" tab. Detail drawer displays interpreted response category `REJECTED` and note: *"Supplier rejected delivery date request."*
*   **Buyer Action**: Conduct manual out-of-band resolution with materials managers.
*   **Expected Result**: Action is resolved manually outside the automatic sync flow.
*   **Verification Outcome**: Stays open until manually resolved and closed by the buyer.

---

## Manual Walkthrough Steps

1.  **Reset State**: Run the command `node scripts/reset-demo-state.js` in your terminal to initialize/restore the curated seed dataset.
2.  **Open Workbench**: Navigate to `http://localhost:3000` in your browser.
3.  **Go to Recommendation Worklist**: Click on the **Recommendation Worklist** tab (`📋`) in the left sidebar.
4.  **Inspect Summary Metrics**: Verify that the top KPIs show active exceptions (Open Exceptions: 8, Buyer Action Required, etc.).
5.  **Filter by Status**:
    *   Click on **Pending Supplier Response**. Verify `demo-rec-002` displays. Open its detail drawer and review the reminder log history.
    *   Click on **Supplier Responded**. Verify `demo-rec-003` and `demo-rec-004` display. Inspect their interpreted responses in the drawer.
6.  **Progress manual update workflow**:
    *   Filter by **Pending SAP Update**. Click on `demo-rec-005`.
    *   Review instructions: *"Recommended manual SAP update required: change delivery_date to '2026-03-15' in SAP."*
    *   Click **Confirm manual SAP action completed**. Verify that the status transitions to `VERIFICATION_PENDING` (Verification status: `PENDING_NEXT_SYNC`).
7.  **Manual Verification**:
    *   Filter by **Verification Pending**. Click on the transitioned item (or `demo-rec-006`).
    *   Click **Verify Now**.
    *   Verify that the state immediately transitions to `CONFIRMED_RESOLVED`, the verification status changes to `PASSED`, and the message displays: *"Verification passed. Expected value matches latest source data."*
    *   Confirm that the footer now shows *"🔒 Closed history is read-only"*.
