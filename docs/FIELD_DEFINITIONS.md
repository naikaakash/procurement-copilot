# Trusted Field Definitions Layer (Release 1)

This document establishes the single source of truth for core business field definitions, calculations, granularity levels, and usage rules within **Procurement Copilot — Release 1: Supplier Commitment Core**.

---

## Core & Derived Fields Registry

### 1. Ordered Quantity
* **Business Meaning:** The total quantity of materials officially requested from the supplier under a specific purchase order item.
* **Source Field/Table:** `order_qty` in `purchase_order_items.csv`.
* **Calculation Rule:** None (static core value).
* **Level of Granularity:** PO Item.
* **Where it is Used:** Detail drawer (posted warehouse goods receipts log), Supplier Acknowledgements (summary calculations).
* **Important Caveats:** This is item-level and reflects the sum of all scheduled quantities for that item. It should not be used directly on screens representing individual schedule lines (unless there is only one schedule line for that item).

### 2. Schedule Line Quantity
* **Business Meaning:** The specific quantity of materials scheduled for delivery on a specific date under a specific PO item schedule line.
* **Source Field/Table:** `scheduled_qty` in `po_schedule_lines.csv`.
* **Calculation Rule:** None (static core value).
* **Level of Granularity:** PO Schedule Line.
* **Where it is Used:** Overdue Workbench (worklist grid and summaries), Detail drawer (ERP sync alerts).
* **Important Caveats:** A single PO item can have multiple schedule lines. Always query schedule line level values for workbench/line-item rows.

### 3. Received Quantity / GR Quantity
* **Business Meaning:** The quantity of materials that have actually been received and posted by the warehouse.
* **Source Field/Table:** `received_qty` in `goods_receipts.csv` (ground truth) or `received_qty` in `po_schedule_lines.csv` (ERP value).
* **Calculation Rule:** Dynamic FIFO allocation across PO item schedule lines based on the chronological sum of `received_qty` from `goods_receipts.csv`.
* **Level of Granularity:** PO Schedule Line (allocated) / PO Item (sum).
* **Where it is Used:** Overdue Workbench (worklist grid), Detail drawer (timelines).
* **Important Caveats:** The ERP schedule line received quantity can sometimes become desynchronized from the actual posted goods receipts. The workbench calculates the actual received quantity dynamically on the fly from goods receipt logs using a FIFO queue.

### 4. Open Quantity
* **Business Meaning:** The quantity of materials that are still outstanding and have not been received.
* **Source Field/Table:** Derived.
* **Calculation Rule:** 
  `Open Quantity = Max(0, Scheduled/Ordered Quantity - Received Quantity)`
  Calculated using the backend helper `calculateOpenQuantity(ordered, received)` in `src/services/data/csvDataService.ts`.
* **Level of Granularity:** PO Schedule Line (workbench/drawer) or PO Item (global stats).
* **Where it is Used:** Executive Overview, Overdue Workbench grid, Detail drawer, Supplier Acknowledgements, Supplier Analytics.
* **Important Caveats:** Always use the shared calculation helper. Do not perform inline subtractions in frontend components.

### 5. Open Value
* **Business Meaning:** The financial value of the outstanding/unreceived order quantity.
* **Source Field/Table:** Derived.
* **Calculation Rule:** 
  `Open Value = Open Quantity * Net Price` (net price is loaded from `purchase_order_items.csv` `net_price`).
* **Level of Granularity:** PO Schedule Line (workbench/drawer) or PO Item (activity feed).
* **Where it is Used:** Executive Overview, Overdue Workbench grid, Detail drawer, Supplier Acknowledgements, Supplier Analytics.
* **Important Caveats:** If the calculated open quantity drops to `0`, the open value must also evaluate to `0` (or fallback to CSV `financial_impact_estimate` if and only if representing a static legacy exception estimate). Always perform undefined/null checks instead of short-circuit `||` operators so that `0` values do not fall back to full order value.

### 6. Requested Delivery Date
* **Business Meaning:** The date on which the buyer requested the supplier to deliver the materials.
* **Source Field/Table:** `due_date` in `exception_worklist.csv` / `delivery_date` in `po_schedule_lines.csv`.
* **Calculation Rule:** None (static core value, shifted forward dynamically in development mode to match live date simulation).
* **Level of Granularity:** PO Schedule Line.
* **Where it is Used:** Executive Overview, Overdue Workbench grid, Supplier Acknowledgements, Detail drawer.
* **Important Caveats:** In Release 1, requested delivery dates are dynamically shifted forward on each request to simulate a "live" date stream, ensuring relative days overdue stay constant relative to the current system date.

### 7. Confirmed Delivery Date
* **Business Meaning:** The delivery date promised and acknowledged by the supplier.
* **Source Field/Table:** `committed_delivery_date` in `supplier_acknowledgements.csv` or `confirmed_date` in `po_schedule_lines.csv`.
* **Calculation Rule:** None (static value).
* **Level of Granularity:** PO Item / PO Schedule Line.
* **Where it is Used:** Supplier Acknowledgements, Detail drawer (Tracking Delivery Timeline).
* **Important Caveats:** If missing, indicates the supplier has not yet acknowledged the PO line.

### 8. Overdue Days
* **Business Meaning:** The number of days a schedule line is past its requested delivery date.
* **Source Field/Table:** Derived.
* **Calculation Rule:** 
  `Overdue Days = Max(0, TODAY_DATE - Requested Delivery Date)`
* **Level of Granularity:** PO Schedule Line.
* **Where it is Used:** Executive Overview, Overdue Workbench, Supplier Acknowledgements, Supplier Analytics, Detail drawer.
* **Important Caveats:** Uses `TODAY_DATE` (local current date formatted as `YYYY-MM-DD`) as the evaluation anchor.

### 9. Acknowledgement Status
* **Business Meaning:** The verification status of the supplier's commitment response.
* **Source Field/Table:** `acknowledgement_status` in `supplier_acknowledgements.csv`.
* **Calculation Rule:** Uses value from table; if no acknowledgement record exists for the PO item, it defaults to `'MISSING'`.
* **Level of Granularity:** PO Item.
* **Where it is Used:** Executive Overview, Overdue Workbench, Supplier Acknowledgements, Detail drawer.
* **Important Caveats:** A status of `'MISSING'` means no Supplier Response has been registered.

### 10. Follow-up Status
* **Business Meaning:** Tracks the expediting state of communication with the supplier regarding an overdue or unacknowledged PO line.
* **Source Field/Table:** Derived.
* **Calculation Rule:** Based on the presence of outbound communication records in `communication_logs.csv` and `buyer_followup_count` in `supplier_acknowledgements.csv`.
* **Level of Granularity:** PO Item.
* **Where it is Used:** Overdue Workbench, Supplier Acknowledgements, Detail drawer (Action Workbench).
* **Important Caveats:** Status progresses from `PENDING` -> `ACTION_DRAFTED` -> `SENT` when a buyer approves and dispatches an expedite email template in the Action Workbench.

### 11. Priority
* **Business Meaning:** An automated routing urgency classification (CRITICAL, HIGH, MEDIUM, LOW) to help buyers focus on the most severe exceptions.
* **Source Field/Table:** Derived.
* **Calculation Rule:** Calculated in `csvDataService.ts` using logarithmic prioritization scaling based on logarithmic overdue days, supplier risk tier, and financial open value:
  `priorityScore = (15 * ln(days_overdue + 1)) + (supplier_risk_score * 0.2) + severity_weight + value_weight`
* **Level of Granularity:** PO Schedule Line (exception-level).
* **Where it is Used:** Executive Overview, Overdue Workbench, Detail drawer.
* **Important Caveats:** Always read the prioritized scoring from the backend. The detail drawer aligns directly with the grid priority score (recalculated fallbacks are only utilized if no active grid exception exists).

### 12. Resolution Status
* **Business Meaning:** Indicates whether the overdue PO exception has been resolved (cleared) or is still active.
* **Source Field/Table:** Derived.
* **Calculation Rule:** 
  - If `Open Quantity` = `0`, status is dynamically set to `'RESOLVED'`.
  - Otherwise, status is equal to the exception's original worklist state (e.g. `'NEW'`, `'IN_REVIEW'`).
* **Level of Granularity:** PO Schedule Line (exception-level).
* **Where it is Used:** Overdue Workbench, Supplier Acknowledgements, Executive Overview (filtering).
* **Important Caveats:** A line is resolved when all scheduled parts have been fully posted as received in the warehouse.

### 13. Supplier Response Date
* **Business Meaning:** The timestamp of the supplier's last portal action or email acknowledgment.
* **Source Field/Table:** `last_supplier_response_date` in `supplier_acknowledgements.csv`.
* **Calculation Rule:** None (static value).
* **Level of Granularity:** PO Item.
* **Where it is Used:** Supplier Acknowledgements, Detail drawer.
* **Important Caveats:** Present only if the acknowledgement status is not `'MISSING'`.

### 14. Last Follow-up Date
* **Business Meaning:** The timestamp of the most recent expedite reminder sent by the buyer.
* **Source Field/Table:** Derived.
* **Calculation Rule:** The latest `sent_date` from `communication_logs.csv` where the direction is `'OUTBOUND'`.
* **Level of Granularity:** PO Item.
* **Where it is Used:** Supplier Acknowledgements, Detail drawer.
* **Important Caveats:** Reflects the timestamp of the last executed expediting template.
