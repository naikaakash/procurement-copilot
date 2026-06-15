# 📝 Business & System Validation Test Cases

This document details the business and system validation test cases for the **Supplier Commitment Control Center**. These test cases verify the logical correctness of calculations, data classifications, exceptions, and workflows against the underlying source data (`data/mock-po-data.json`).

---

## 📂 Summary of Scenarios Covered
The accompanying mock dataset contains **30 PO lines** mapping to the following test criteria:
*   **Active Open Orders:** Fully open, partially received, future delivery.
*   **Awaiting Supplier Confirmation:** Missing acknowledgements, late acknowledgements, high-value missing confirmations.
*   **Supplier Reminders:** Overdue lines, reminders already sent, reminder-eligible.
*   **Goods Receipt (GR) Exceptions:** Pending GR, partial GR, completed GR, over-receipts.
*   **Invoice Receipt (IR) Exceptions:** Pending invoice, blocked invoice (price/quantity variances), GR/IR mismatches.
*   **Risk & Exception Management:** High/medium/low risk lines, repeated supplier delays, high-value blocked invoices.
*   **Data Quality Anomalies:** Negative quantities, invalid delivery dates, missing master data (null vendor).

---

## 🛠️ Section 1: Open PO Line Validation

### TC-OP-01: Total Open PO Lines Count
*   **Test Case ID:** TC-OP-01
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Total count of active open PO lines in the system.
*   **How to validate the figure/result manually:** Count all PO lines where `deletion_completion_indicator` is `ACTIVE_OPEN` AND `open_quantity` > 0.
*   **Source fields needed:** `po_number`, `item_number`, `deletion_completion_indicator`, `open_quantity`
*   **Test data condition:** `deletion_completion_indicator` = `ACTIVE_OPEN`, `open_quantity` > 0
*   **Steps to test:** 
    1. Filter the source dataset (`mock-po-data.json`) for items where `deletion_completion_indicator` is `ACTIVE_OPEN`.
    2. Exclude any lines where `open_quantity` <= 0 (e.g. fully received or over-received lines).
    3. Compare the resulting count against the system dashboard's Open PO Lines metric.
*   **Expected result:** System correctly counts only active, non-deleted, non-closed lines with a positive remaining open quantity.
*   **Pass/fail criteria:** PASS if count matches source count (e.g., 20 lines); FAIL if it includes deleted (indicator `DELETED`) or completed (indicator `COMPLETED`) lines.
*   **Priority:** High

### TC-OP-02: Open PO Value Calculation
*   **Test Case ID:** TC-OP-02
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Total open PO financial value.
*   **How to validate the figure/result manually:** For each active open PO line, calculate `Open Value = Open Quantity * Unit Price` (adjusting for currency if aggregated). Sum these values.
*   **Source fields needed:** `open_quantity`, `unit_price`, `currency`, `open_value`
*   **Test data condition:** `open_quantity` > 0, `deletion_completion_indicator` = `ACTIVE_OPEN`
*   **Steps to test:**
    1. Filter all open PO lines.
    2. Multiply `open_quantity` by `unit_price` for each line.
    3. Sum all calculated open values and reconcile with the dashboard's Open PO Value.
*   **Expected result:** The system open value matches the sum of calculated open line values.
*   **Pass/fail criteria:** PASS if system value equals manually computed value within currency rounding tolerance (e.g. ±$0.01).
*   **Priority:** High

### TC-OP-03: Open Quantity Verification
*   **Test Case ID:** TC-OP-03
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Remaining quantity to be delivered.
*   **How to validate the figure/result manually:** Check `Open Quantity = Ordered Quantity - Received Quantity`.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `open_quantity`
*   **Test data condition:** Active PO lines with varying receipt levels.
*   **Steps to test:**
    1. Select PO `4500002002` (ordered 200, received 80).
    2. Compute: `200 - 80 = 120`.
    3. Check if the system displays `open_quantity` as `120`.
*   **Expected result:** System shows `120` as the open quantity.
*   **Pass/fail criteria:** PASS if open quantity is exactly 120; FAIL if it displays 200 or any other number.
*   **Priority:** High

### TC-OP-04: Partially Delivered PO Lines Classification
*   **Test Case ID:** TC-OP-04
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Classification status as "Partially Received".
*   **How to validate the figure/result manually:** Verify that `received_quantity` > 0 AND `received_quantity` < `ordered_quantity`.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `po_status`
*   **Test data condition:** `received_quantity` > 0 and < `ordered_quantity` (e.g. PO `4500002002`).
*   **Steps to test:**
    1. Locate PO `4500002002` in the dataset.
    2. Confirm `received_quantity` is 80 and `ordered_quantity` is 200.
    3. Verify that the line status is classified as `PARTIALLY_RECEIVED` or "Partial GR".
*   **Expected result:** Line is classified as a partial delivery and remains in the open worklist.
*   **Pass/fail criteria:** PASS if classified as partial; FAIL if classified as fully open or fully closed.
*   **Priority:** Medium

### TC-OP-05: Fully Delivered PO Lines Exclusion
*   **Test Case ID:** TC-OP-05
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Completed/fully received lines excluded from active open worklists.
*   **How to validate the figure/result manually:** Confirm that lines where `received_quantity` = `ordered_quantity` are filtered out of open worklists.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `po_status`, `open_quantity`
*   **Test data condition:** `received_quantity` == `ordered_quantity` (e.g., PO `4500002003`).
*   **Steps to test:**
    1. Identify PO `4500002003` (Ordered 150, Received 150).
    2. Open the active overdue and acknowledgement worklists.
    3. Verify PO `4500002003` does not appear as an open action item.
*   **Expected result:** Fully delivered lines are marked as completed and hidden from action worklists.
*   **Pass/fail criteria:** PASS if excluded from active worklists; FAIL if listed as needing buyer action.
*   **Priority:** High

### TC-OP-06: Deleted / Cancelled PO Lines Exclusion
*   **Test Case ID:** TC-OP-06
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Cancelled lines are excluded from open value and line counts.
*   **How to validate the figure/result manually:** Check if lines with `deletion_completion_indicator` = `DELETED` are excluded from open metrics despite having an `ordered_quantity` > 0.
*   **Source fields needed:** `deletion_completion_indicator`, `ordered_quantity`, `open_quantity`, `open_value`
*   **Test data condition:** `deletion_completion_indicator` = `DELETED` (e.g., PO `4500002015`).
*   **Steps to test:**
    1. Retrieve PO `4500002015` (Ordered 100, Received 0, but marked `DELETED`).
    2. Reconcile Open PO Line count and Open Value.
    3. Ensure `open_quantity` and `open_value` are treated as `0` by the calculation engine.
*   **Expected result:** System reads the deletion indicator and overrides open values to zero.
*   **Pass/fail criteria:** PASS if open value is 0; FAIL if $1,500 is added to open spend.
*   **Priority:** Critical

### TC-OP-07: POs Incorrectly Counted as Open (Data Leakage)
*   **Test Case ID:** TC-OP-07
*   **Business Area:** Open PO line validation
*   **What the system is showing:** Closed or completed orders appearing in open lists.
*   **How to validate the figure/result manually:** Inspect if any PO with `deletion_completion_indicator` = `COMPLETED` is included in the open list.
*   **Source fields needed:** `deletion_completion_indicator`, `po_status`
*   **Test data condition:** `deletion_completion_indicator` = `COMPLETED` (e.g., PO `4500002016`).
*   **Steps to test:**
    1. Search the active open PO worklist for PO `4500002016`.
    2. Confirm it is absent from the active queue.
*   **Expected result:** Completed items are strictly excluded.
*   **Pass/fail criteria:** PASS if absent; FAIL if present in the active queue.
*   **Priority:** High

---

## ⏰ Section 2: Overdue PO Validation

### TC-OV-01: Overdue PO Count & Rule Logic
*   **Test Case ID:** TC-OV-01
*   **Business Area:** Overdue PO validation
*   **What the system is showing:** Overdue PO lines count.
*   **How to validate the figure/result manually:** Count all PO lines where `delivery_date` < `today` (2026-06-10) AND `open_quantity` > 0 AND `deletion_completion_indicator` != `DELETED` / `COMPLETED`.
*   **Source fields needed:** `delivery_date`, `open_quantity`, `deletion_completion_indicator`
*   **Test data condition:** `delivery_date` < "2026-06-10", `open_quantity` > 0
*   **Steps to test:**
    1. Scan mock data for lines with delivery dates before June 10, 2026.
    2. Filter out closed (e.g. `4500002003`) and deleted (e.g. `4500002027`) lines.
    3. Verify that PO `4500002004` (May 20, 2026), PO `4500002008` (June 2, 2026), PO `4500002009` (June 8, 2026), PO `4500002022` (May 15, 2026), PO `4500002023` (May 20, 2026), and PO `4500002024` (June 1, 2026) are flagged as overdue.
*   **Expected result:** Only active open lines with past-due dates are counted.
*   **Pass/fail criteria:** PASS if system flags exactly the overdue lines; FAIL if it includes future deliveries (e.g. `4500002005` with July 15, 2026) or closed lines.
*   **Priority:** Critical

### TC-OV-02: Overdue PO Value
*   **Test Case ID:** TC-OV-02
*   **Business Area:** Overdue PO validation
*   **What the system is showing:** Financial value of overdue materials.
*   **How to validate the figure/result manually:** Sum the `open_value` of all qualified overdue PO lines.
*   **Source fields needed:** `delivery_date`, `open_value`, `deletion_completion_indicator`
*   **Test data condition:** Overdue criteria met.
*   **Steps to test:**
    1. Reconcile the overdue lines from TC-OV-01.
    2. Sum their open values: PO `4500002004` ($15,000) + PO `4500002008` ($6,000) + PO `4500002009` ($1,500) + PO `4500002022` ($75,000) + PO `4500002023` ($3,000) + PO `4500002024` ($1,500) + PO `4500002026` ($1,500).
    3. Total = $103,500. Check system dashboard value.
*   **Expected result:** Overdue value is displayed as exactly $103,500 (adjusting for Euro conversions if EUR service POs are included, e.g. PO `4500002020`).
*   **Pass/fail criteria:** PASS if system matches calculated sum; FAIL if it mismatches.
*   **Priority:** High

### TC-OV-03: Overdue by Supplier/Plant/Buyer
*   **Test Case ID:** TC-OV-03
*   **Business Area:** Overdue PO validation
*   **What the system is showing:** Allocation of overdue lines by Supplier, Plant, or Buyer.
*   **How to validate the figure/result manually:** Group the identified overdue lines by the respective dimension and check sub-totals.
*   **Source fields needed:** `supplier`, `plant`, `buyer`, `open_value`
*   **Test data condition:** Valid overdue lines.
*   **Steps to test:**
    1. Reconcile overdue lines for buyer "Alex Buyer (BUY-01)": `4500002004` ($15k), `4500002009` ($1.5k), `4500002023` ($3k), `4500002024` ($1.5k), `4500002026` ($1.5k). Total = $22,500.
    2. Reconcile overdue lines for buyer "Sarah Planner (BUY-02)": `4500002022` ($75k). Total = $75,000.
    3. Verify that drill-downs or charts reflect these specific totals.
*   **Expected result:** System correctly segments metrics by buyer/supplier/plant.
*   **Pass/fail criteria:** PASS if grouped sums match; FAIL if any PO is allocated to the wrong buyer or plant.
*   **Priority:** High

### TC-OV-04: Overdue Aging Buckets
*   **Test Case ID:** TC-OV-04
*   **Business Area:** Overdue PO validation
*   **What the system is showing:** Aging distribution (e.g. 1-7 days, 8-15 days, 16-30 days, 30+ days).
*   **How to validate the figure/result manually:** Calculate `Days Overdue = Today (2026-06-10) - Delivery Date`. Sort into buckets.
*   **Source fields needed:** `delivery_date`
*   **Test data condition:** Overdue lines with varying delivery dates.
*   **Steps to test:**
    1. Reconcile PO `4500002009` (Delivery: June 8, 2026). Overdue days: `10 - 8 = 2` days. Bucket: **1–7 days**.
    2. Reconcile PO `4500002008` (Delivery: June 2, 2026). Overdue days: `10 - 2 = 8` days. Bucket: **8–15 days**.
    3. Reconcile PO `4500002024` (Delivery: June 1, 2026). Overdue days: `10 - 1 = 9` days. Bucket: **8–15 days**.
    4. Reconcile PO `4500002004` (Delivery: May 20, 2026). Overdue days: `10 - 20 = 21` days. Bucket: **16–30 days**.
    5. Reconcile PO `4500002023` (Delivery: May 20, 2026). Overdue days: 21 days. Bucket: **16–30 days**.
    6. Reconcile PO `4500002022` (Delivery: May 15, 2026). Overdue days: 26 days. Bucket: **16–30 days**.
    7. Reconcile PO `4500002026` (Delivery: May 15, 2026). Overdue days: 26 days. Bucket: **16–30 days**.
    8. Check if the aging bar charts or tables reflect these assignments.
*   **Expected result:** All overdue lines are correctly aged and allocated to their respective buckets.
*   **Pass/fail criteria:** PASS if allocations are mathematically correct; FAIL if any line is misclassified.
*   **Priority:** High

---

## 📦 Section 3: Goods Receipt (GR) Validation

### TC-GR-01: Goods Receipt Completed
*   **Test Case ID:** TC-GR-01
*   **Business Area:** Goods receipt / GR validation
*   **What the system is showing:** Line items with completed Goods Receipt.
*   **How to validate the figure/result manually:** Confirm that `received_quantity` >= `ordered_quantity` and `gr_status` = `COMPLETED`.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `gr_status`
*   **Test data condition:** `received_quantity` matches or exceeds `ordered_quantity`.
*   **Steps to test:**
    1. Identify PO `4500002003` (Ordered 150, Received 150).
    2. Confirm system status is shown as completed.
*   **Expected result:** System flags the GR status as completed.
*   **Pass/fail criteria:** PASS if system status is `COMPLETED`; FAIL if shown as open, partial, or pending.
*   **Priority:** Medium

### TC-GR-02: Partial GR Detection
*   **Test Case ID:** TC-GR-02
*   **Business Area:** Goods receipt / GR validation
*   **What the system is showing:** Line items with partially completed Goods Receipt.
*   **How to validate the figure/result manually:** Check if `received_quantity` > 0 AND `received_quantity` < `ordered_quantity` and `gr_status` = `PARTIAL`.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `gr_status`
*   **Test data condition:** PO `4500002002` (Ordered 200, Received 80).
*   **Steps to test:**
    1. Reconcile PO `4500002002`.
    2. Check if the GR status indicates partial receipt.
*   **Expected result:** GR status shows "PARTIAL" or "Partially Received".
*   **Pass/fail criteria:** PASS if correctly classified; FAIL if marked complete or pending.
*   **Priority:** High

### TC-GR-03: Excess GR (Over-receipt Alert)
*   **Test Case ID:** TC-GR-03
*   **Business Area:** Goods receipt / GR validation
*   **What the system is showing:** Exception alert for over-receipt.
*   **How to validate the figure/result manually:** Identify lines where `received_quantity` > `ordered_quantity`.
*   **Source fields needed:** `ordered_quantity`, `received_quantity`, `exception_reason`
*   **Test data condition:** PO `4500002028` (Ordered 100, Received 120).
*   **Steps to test:**
    1. Search for PO `4500002028` in the system exceptions view.
    2. Verify it is flagged with a quantity exception warning (e.g. over-receipt of 20 units).
*   **Expected result:** System triggers a quantity variance exception.
*   **Pass/fail criteria:** PASS if flagged with exception reason related to over-receipt; FAIL if accepted silently as a clean completed line.
*   **Priority:** Medium

### TC-GR-04: GR Missing (Delivery Date Passed)
*   **Test Case ID:** TC-GR-04
*   **Business Area:** Goods receipt / GR validation
*   **What the system is showing:** Overdue PO lines with zero receipts.
*   **How to validate the figure/result manually:** Filter lines where `delivery_date` < `today` AND `received_quantity` = 0.
*   **Source fields needed:** `delivery_date`, `received_quantity`, `po_status`
*   **Test data condition:** Delivery date in past, received qty is 0 (e.g., PO `4500002024`).
*   **Steps to test:**
    1. Reconcile PO `4500002024` (Delivery: June 1, 2026, Received: 0).
    2. Verify it is shown in the Overdue Workbench with an exception note: "No Goods Receipt entered".
*   **Expected result:** System flags this as a critical missing GR exception.
*   **Pass/fail criteria:** PASS if flagged; FAIL if ignored.
*   **Priority:** High

---

## 🧾 Section 4: Invoice / IR Validation

### TC-IV-01: Invoice Blocked (Price Variance)
*   **Test Case ID:** TC-IV-01
*   **Business Area:** Invoice / IR validation
*   **What the system is showing:** Invoice blocked due to price variance discrepancy.
*   **How to validate the figure/result manually:** Confirm `invoice_blocked_flag` = `Y` AND `price_variance` > 0.
*   **Source fields needed:** `invoice_blocked_flag`, `price_variance`, `invoice_status`
*   **Test data condition:** Invoice blocked, price variance > 0 (e.g., PO `4500002012`).
*   **Steps to test:**
    1. Query PO `4500002012` in the invoice review interface.
    2. Reconcile the variance amount: unit price is $15, but invoice reflects a variance of $1,250.
    3. Ensure the blocked indicator is displayed.
*   **Expected result:** Line shows a "Price Block" exception and is categorized in the "Blocked Invoice" metric.
*   **Pass/fail criteria:** PASS if price block is flagged and variance matches $1,250; FAIL if invoice is listed as approved or price variance is blank.
*   **Priority:** High

### TC-IV-02: GR Done but Invoice Missing
*   **Test Case ID:** TC-IV-02
*   **Business Area:** Invoice / IR validation
*   **What the system is showing:** Goods received fully, but no invoice has been posted (pending liability).
*   **How to validate the figure/result manually:** Identify lines where `received_quantity` > 0 AND `invoiced_quantity` = 0.
*   **Source fields needed:** `received_quantity`, `invoiced_quantity`, `invoice_status`
*   **Test data condition:** `received_quantity` = 250, `invoiced_quantity` = 0 (e.g., PO `4500002013`).
*   **Steps to test:**
    1. Filter the dataset for PO `4500002013`.
    2. Verify that `invoice_status` is classified as `PENDING` and it is highlighted as "GR Posted, Invoice Pending".
*   **Expected result:** System shows the line as outstanding for invoice processing.
*   **Pass/fail criteria:** PASS if classified correctly; FAIL if invoice is shown as complete.
*   **Priority:** Medium

### TC-IV-03: Invoice Received Before GR (GR/IR Mismatch)
*   **Test Case ID:** TC-IV-03
*   **Business Area:** Invoice / IR validation
*   **What the system is showing:** Invoice posted without matching Goods Receipt (system block).
*   **How to validate the figure/result manually:** Identify lines where `invoiced_quantity` > `received_quantity` (specifically when received is 0).
*   **Source fields needed:** `invoiced_quantity`, `received_quantity`, `invoice_status`
*   **Test data condition:** `invoiced_quantity` = 1000, `received_quantity` = 0 (e.g., PO `4500002014`).
*   **Steps to test:**
    1. Query PO `4500002014`.
    2. Verify it displays a GR/IR mismatch warning and is blocked from payment.
*   **Expected result:** System identifies the quantity variance (invoice quantity 1000 vs receipt quantity 0) and blocks it.
*   **Pass/fail criteria:** PASS if invoice shows quantity block; FAIL if processed without block.
*   **Priority:** Critical

---

## 🤝 Section 5: Supplier Acknowledgement Validation

### TC-AK-01: Missing Acknowledgement Exception
*   **Test Case ID:** TC-AK-01
*   **Business Area:** Supplier acknowledgement validation
*   **What the system is showing:** PO line awaiting confirmation.
*   **How to validate the figure/result manually:** Confirm `acknowledgement_required` = `Y` AND `acknowledgement_date` = `null` AND `deletion_completion_indicator` = `ACTIVE_OPEN`.
*   **Source fields needed:** `acknowledgement_required`, `acknowledgement_date`, `deletion_completion_indicator`
*   **Test data condition:** Required but null (e.g., PO `4500002006`).
*   **Steps to test:**
    1. Check the Acknowledgement Workbench list.
    2. Confirm PO `4500002006` is listed under the "Missing Acknowledgements" category.
*   **Expected result:** PO `4500002006` is flagged.
*   **Pass/fail criteria:** PASS if present in missing confirmations list; FAIL if excluded.
*   **Priority:** Critical

### TC-AK-02: Late Acknowledgement Identification
*   **Test Case ID:** TC-AK-02
*   **Business Area:** Supplier acknowledgement validation
*   **What the system is showing:** Acknowledged late exception.
*   **How to validate the figure/result manually:** Verify `acknowledgement_date` is more than 3 days after `po_creation_date`.
*   **Source fields needed:** `po_creation_date`, `acknowledgement_date`
*   **Test data condition:** `acknowledgement_date` - `po_creation_date` > 3 days (e.g. PO `4500002007`, created May 1, acknowledged May 20).
*   **Steps to test:**
    1. Locate PO `4500002007`.
    2. Calculate date variance: 19 days difference.
    3. Verify system marks this historical entry as "Late Acknowledgement".
*   **Expected result:** System registers the supplier's acknowledgement as late.
*   **Pass/fail criteria:** PASS if flagged as historically late; FAIL if marked as on-time.
*   **Priority:** Low

### TC-AK-03: High-Value PO Missing Acknowledgement
*   **Test Case ID:** TC-AK-03
*   **Business Area:** Supplier acknowledgement validation
*   **What the system is showing:** Critical missing acknowledgement.
*   **How to validate the figure/result manually:** Filter lines where `open_value` >= $50,000 AND `acknowledgement_required` = `Y` AND `acknowledgement_date` = `null`.
*   **Source fields needed:** `open_value`, `acknowledgement_required`, `acknowledgement_date`
*   **Test data condition:** Value >= 50k, ack date is null (e.g., PO `4500002010` value: $125,000).
*   **Steps to test:**
    1. Check for highest priority alerts in the Acknowledgement Workbench.
    2. Reconcile if PO `4500002010` is given a severity rating of `CRITICAL` or `HIGH` due to its value.
*   **Expected result:** High-value missing acknowledgements are flagged at the highest severity tier.
*   **Pass/fail criteria:** PASS if prioritized with critical/high severity; FAIL if marked as low priority.
*   **Priority:** Critical

---

## ⚡ Section 7: Risk Score / Exception Validation

### TC-RK-01: Risk Score Manual Calculation Verification
*   **Test Case ID:** TC-RK-01
*   **Business Area:** Risk score / exception validation
*   **What the system is showing:** Risk score (0 to 100) or Risk Category (LOW, MEDIUM, HIGH, CRITICAL).
*   **How to validate the figure/result manually:** Compute risk category based on combined factors:
    *   *Critical:* Overdue > 14 days + High Value (> $50k) + No Acknowledgement.
    *   *High:* Overdue > 7 days OR Invoice Blocked + High Value OR Missing Acknowledgement + High Value.
    *   *Medium:* Overdue 1–7 days OR Missing Acknowledgement (low/medium value) OR Blocked Invoice (low value).
    *   *Low:* On track, future delivery, no exceptions.
*   **Source fields needed:** `delivery_date`, `open_value`, `acknowledgement_date`, `invoice_blocked_flag`, `risk_category`
*   **Test data condition:** Defined exceptions in dataset.
*   **Steps to test:**
    1. Evaluate PO `4500002022` ($75k, delivery date May 15, 2026 - overdue by 26 days).
    2. Apply rule: Overdue > 14 days + High Value ($75k) = `CRITICAL`.
    3. Verify system displays category as `CRITICAL`.
*   **Expected result:** Risk score engine matches the classification.
*   **Pass/fail criteria:** PASS if category is `CRITICAL`; FAIL if marked as low or medium.
*   **Priority:** High

### TC-RK-02: Exclude Cancelled POs from Risk Scoring
*   **Test Case ID:** TC-RK-02
*   **Business Area:** Risk score / exception validation
*   **What the system is showing:** Risk category is `NONE` or blank.
*   **How to validate the figure/result manually:** Check if PO lines marked `DELETED` are excluded from all risk classification processes.
*   **Source fields needed:** `deletion_completion_indicator`, `risk_category`
*   **Test data condition:** `deletion_completion_indicator` = `DELETED` (e.g., PO `4500002027`).
*   **Steps to test:**
    1. Query PO `4500002027`.
    2. Confirm its risk category is output as `NONE` or excluded entirely from risk dashboards.
*   **Expected result:** No active risk score is assigned to deleted lines.
*   **Pass/fail criteria:** PASS if excluded; FAIL if classified as medium/high risk because it technically has an open quantity of 100 in the record.
*   **Priority:** High

---

## 🔍 Section 9: Drill-Down Validation

### TC-DD-01: Open PO Count Drill-Down
*   **Test Case ID:** TC-DD-01
*   **Business Area:** Drill-down validation
*   **What the system is showing:** List of open PO lines after clicking the "Open PO Lines" KPI card.
*   **How to validate the figure/result manually:** Click the KPI card and verify that the number of rows displayed in the resulting table matches the card's count and matches the open count criteria from TC-OP-01.
*   **Source fields needed:** `deletion_completion_indicator`, `open_quantity`
*   **Test data condition:** Dashboard displaying active open count.
*   **Steps to test:**
    1. Click the "Open PO Lines" card on the Dashboard.
    2. Count the number of rows displayed.
    3. Confirm that no row has a completed or deleted indicator.
*   **Expected result:** The count and list match the source list of active open lines.
*   **Pass/fail criteria:** PASS if table list contains only active open lines and count is identical; FAIL if fully completed or deleted items leak into the view.
*   **Priority:** High

### TC-DD-02: Overdue PO Count Drill-Down
*   **Test Case ID:** TC-DD-02
*   **Business Area:** Drill-down validation
*   **What the system is showing:** List of overdue lines after clicking the "Overdue Lines" KPI card.
*   **How to validate the figure/result manually:** Reconcile row list against the overdue criteria (Delivery Date < Today AND Open Qty > 0).
*   **Source fields needed:** `delivery_date`, `open_quantity`, `deletion_completion_indicator`
*   **Test data condition:** Dashboard displaying overdue count.
*   **Steps to test:**
    1. Click the "Overdue PO Lines" card.
    2. Reconcile the filtered list against the overdue lines identified in TC-OV-01.
*   **Expected result:** Drill-down matches the overdue subset exactly.
*   **Pass/fail criteria:** PASS if lists are identical; FAIL if future delivery lines are shown.
*   **Priority:** High

---

## 🛑 Section 10: Data Quality Validation

### TC-DQ-01: Missing Delivery Date Handling
*   **Test Case ID:** TC-DQ-01
*   **Business Area:** Data quality validation
*   **What the system is showing:** Data quality alert or exclusion.
*   **How to validate the figure/result manually:** Identify lines where `delivery_date` is null, blank, or an invalid format (e.g. "INVALID_DATE").
*   **Source fields needed:** `delivery_date`, `exception_reason`
*   **Test data condition:** Invalid delivery date (e.g., PO `4500002018`).
*   **Steps to test:**
    1. Find PO `4500002018` in the system.
    2. Check if the system flags this line as a "Data Quality Exception" and excludes it from standard date-based overdue alerts.
*   **Expected result:** The system identifies the invalid date format and prevents system crash, routing the row to a data quality review queue.
*   **Pass/fail criteria:** PASS if flagged as a data quality issue; FAIL if page crashes or it is calculated as an active on-time order.
*   **Priority:** High

### TC-DQ-02: Negative Quantity Prevention
*   **Test Case ID:** TC-DQ-02
*   **Business Area:** Data quality validation
*   **What the system is showing:** Data quality error flag.
*   **How to validate the figure/result manually:** Search for PO lines where `ordered_quantity` < 0.
*   **Source fields needed:** `ordered_quantity`, `exception_reason`
*   **Test data condition:** Ordered quantity is negative (e.g., PO `4500002029`, quantity -50).
*   **Steps to test:**
    1. Query PO `4500002029`.
    2. Check if it is flagged as a "Negative Quantity Exception".
*   **Expected result:** System flags the negative quantity as a data error.
*   **Pass/fail criteria:** PASS if flagged; FAIL if accepted and subtracted from total open quantity sums.
*   **Priority:** High

### TC-DQ-03: Null Supplier Master Check
*   **Test Case ID:** TC-DQ-03
*   **Business Area:** Data quality validation
*   **What the system is showing:** Missing Master Data alert.
*   **How to validate the figure/result manually:** Verify that PO lines without a supplier ID or name are flagged.
*   **Source fields needed:** `supplier`, `exception_reason`
*   **Test data condition:** Supplier is null or blank (e.g., PO `4500002030`).
*   **Steps to test:**
    1. Search the workbench for PO `4500002030`.
    2. Verify it triggers a high-severity master data exception.
*   **Expected result:** Line is flagged with "Missing Supplier Master".
*   **Pass/fail criteria:** PASS if flagged; FAIL if accepted silently or crashes the UI.
*   **Priority:** High
