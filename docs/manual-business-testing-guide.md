# 📘 Manual Business Testing Guide

This guide is designed for Senior SAP Procurement Testers and Business Analysts to perform manual end-to-end verification of the **Supplier Commitment Control Center**. It guides you through verifying the correctness of all calculations, status classifications, workflows, and dashboard numbers against the source PO database ([/data/mock-po-data.json](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/data/mock-po-data.json)).

---

## 🎛️ Section 1: Dashboard KPI Validation

### TC-KPI-01: Total PO Count
*   **Test Case ID:** TC-KPI-01
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the total PO count matches the unique POs in the source file.
*   **Starting Page:** Dashboard / Executive Overview
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset successfully.
*   **Steps for me to perform:** 
    1. Navigate to the Dashboard.
    2. Read the value in the "Total Purchase Orders" card.
*   **Expected result in app:** Displays exactly `60`.
*   **Manual validation method:** Count the distinct values of the `po_number` field in the mock database.
*   **Source fields to check:** `po_number`
*   **PASS criteria:** Displayed count is exactly 60.
*   **FAIL criteria:** Displayed count is anything other than 60.
*   **Priority:** High
*   **Notes:** Distinct count is required (PO `4500002021` has two lines but counts as one PO).

---

### TC-KPI-02: Total PO Line Count
*   **Test Case ID:** TC-KPI-02
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the total count of PO lines.
*   **Starting Page:** Dashboard / Executive Overview
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset successfully.
*   **Steps for me to perform:**
    1. Read the "Total PO Lines" value from the dashboard header or summary area.
*   **Expected result in app:** Displays exactly `100`.
*   **Manual validation method:** Count the total number of objects in the source JSON array.
*   **Source fields to check:** Array length.
*   **PASS criteria:** Count is exactly 100.
*   **FAIL criteria:** Count is not 100.
*   **Priority:** High
*   **Notes:** None.

---

### TC-KPI-03: Open PO Line Count
*   **Test Case ID:** TC-KPI-03
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify open PO lines match filtering rules.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "Open PO Lines" card value.
*   **Expected result in app:** Displays exactly `76`.
*   **Manual validation method:** Count lines where `deletion_completion_indicator` == `ACTIVE_OPEN` AND `open_quantity` > 0.
*   **Source fields to check:** `deletion_completion_indicator`, `open_quantity`
*   **PASS criteria:** Metric matches 76.
*   **FAIL criteria:** Metric displays closed, deleted, or negative quantity lines.
*   **Priority:** Critical
*   **Notes:** Refer to the [Drill-Down Section](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/docs/dashboard-reconciliation-guide.md) for exclusions.

---

### TC-KPI-04: Open PO Value
*   **Test Case ID:** TC-KPI-04
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the total financial value of open PO lines.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "Open PO Value" card.
*   **Expected result in app:** Displays `$1,592,110.00`.
*   **Manual validation method:** Sum `open_value` of the 76 active open PO lines.
*   **Source fields to check:** `open_value`, `currency`, `open_quantity`
*   **PASS criteria:** Match within rounding tolerance.
*   **FAIL criteria:** Open values of deleted/closed lines are included.
*   **Priority:** High
*   **Notes:** None.

---

### TC-KPI-05: Overdue PO Count
*   **Test Case ID:** TC-KPI-05
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the count of open PO lines with passed delivery dates.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** System date is June 10, 2026.
*   **Steps for me to perform:** Read "Overdue PO Lines" card.
*   **Expected result in app:** Displays exactly `23`.
*   **Manual validation method:** Count active open lines where `delivery_date` < `2026-06-10`.
*   **Source fields to check:** `delivery_date`, `open_quantity`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 23.
*   **FAIL criteria:** Count includes future lines or closed/deleted lines.
*   **Priority:** Critical
*   **Notes:** Exclude invalid dates (e.g. PO `4500002018`).

---

### TC-KPI-06: Overdue PO Value
*   **Test Case ID:** TC-KPI-06
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the value of overdue lines.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Date set to June 10, 2026.
*   **Steps for me to perform:** Read "Overdue PO Value" card.
*   **Expected result in app:** Displays `$211,950.00`.
*   **Manual validation method:** Sum `open_value` of the 23 overdue lines.
*   **Source fields to check:** `open_value`, `delivery_date`, `deletion_completion_indicator`
*   **PASS criteria:** Match within rounding tolerance.
*   **FAIL criteria:** Incorrect sum.
*   **Priority:** High
*   **Notes:** Ensure EUR-to-USD conversion is active for service PO `4500002020`.

---

### TC-KPI-07: Pending Acknowledgement Count
*   **Test Case ID:** TC-KPI-07
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify counts of missing acknowledgements.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "Pending Acks" card.
*   **Expected result in app:** Displays exactly `14`.
*   **Manual validation method:** Count lines where `acknowledgement_required` == `Y` and `acknowledgement_date` == `null` and `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Source fields to check:** `acknowledgement_required`, `acknowledgement_date`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 14.
*   **FAIL criteria:** Includes lines where ack is not required or already received.
*   **Priority:** High
*   **Notes:** None.

---

### TC-KPI-08: Pending Goods Receipt Count
*   **Test Case ID:** TC-KPI-08
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify count of pending goods receipts.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "Pending GR" card.
*   **Expected result in app:** Displays exactly `22`.
*   **Manual validation method:** Count open lines where `gr_status` == `PENDING` and `delivery_date` <= `2026-06-10` and `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Source fields to check:** `gr_status`, `delivery_date`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 22.
*   **FAIL criteria:** Count is not 22.
*   **Priority:** High
*   **Notes:** None.

---

### TC-KPI-09: Invoice Blocked Count
*   **Test Case ID:** TC-KPI-09
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the count of blocked invoices.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "Blocked Invoices" card.
*   **Expected result in app:** Displays exactly `8`.
*   **Manual validation method:** Count lines where `invoice_blocked_flag` == `Y`.
*   **Source fields to check:** `invoice_blocked_flag`
*   **PASS criteria:** Count is 8.
*   **FAIL criteria:** Count is not 8.
*   **Priority:** High
*   **Notes:** Blocked lines are: `4500002012`, `4500002014`, `4500002025`, `4500002028`.

---

### TC-KPI-10: High-Risk PO Count
*   **Test Case ID:** TC-KPI-10
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Verify the count of high-risk POs.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Read "High Risk Orders" card.
*   **Expected result in app:** Displays exactly `18`.
*   **Manual validation method:** Count lines where `risk_category` is `HIGH` or `CRITICAL` AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Source fields to check:** `risk_category`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 18.
*   **FAIL criteria:** Count includes deleted risk lines (e.g. `4500002027`).
*   **Priority:** High
*   **Notes:** None.

---

### TC-KPI-11: Supplier Exception Count
*   **Test Case ID:** TC-KPI-11
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Reconcile exception counts by supplier.
*   **Starting Page:** Supplier Analytics
*   **Test PO / Supplier / Plant:** Sterling Electronics (VEND-001)
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** 
    1. Navigate to Supplier Analytics.
    2. Click on "Sterling Electronics".
    3. Read exception count indicator.
*   **Expected result in app:** Shows exceptions matching Sterling.
*   **Manual validation method:** Filter mock data for supplier == "Sterling Electronics" AND `exception_reason` != "None".
*   **Source fields to check:** `supplier`, `exception_reason`
*   **PASS criteria:** Counts reconcile.
*   **FAIL criteria:** Count is wrong.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-KPI-12: Buyer Exception Count
*   **Test Case ID:** TC-KPI-12
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Reconcile exceptions by buyer.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** Alex Buyer (BUY-01)
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** View Buyer exceptions section or chart.
*   **Expected result in app:** Shows `15` exceptions for Alex Buyer.
*   **Manual validation method:** Filter mock data for buyer == "Alex Buyer (BUY-01)" AND `exception_reason` != "None" AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Source fields to check:** `buyer`, `exception_reason`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 15.
*   **FAIL criteria:** Mismatch.
*   **Priority:** Medium
*   **Notes:** Exclude deleted lines.

---

### TC-KPI-13: Plant Exception Count
*   **Test Case ID:** TC-KPI-13
*   **Test Area:** Dashboard KPI Validation
*   **Test Objective:** Reconcile exceptions by plant.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** Plant PL01
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** View Plant exceptions section or chart.
*   **Expected result in app:** Shows `16` exceptions for Plant PL01.
*   **Manual validation method:** Filter mock data for plant == "PL01" AND `exception_reason` != "None" AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Source fields to check:** `plant`, `exception_reason`, `deletion_completion_indicator`
*   **PASS criteria:** Count is 16.
*   **FAIL criteria:** Mismatch.
*   **Priority:** Medium
*   **Notes:** None.

---

## 📂 Section 2: Open PO Line Testing

### TC-OP-01: Fully Open PO Line
*   **Test Case ID:** TC-OP-01
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Validate that a fully open PO line is displayed correctly.
*   **Starting Page:** Search / Open PO view
*   **Test PO / Supplier / Plant:** PO `4500002001`
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Search for PO `4500002001` and open its details.
*   **Expected result in app:**
    *   Ordered Qty = `100`
    *   Received Qty = `0`
    *   Open Qty = `100`
    *   Open Value = `$1,500.00`
    *   Status = `OPEN`
*   **Manual validation method:** Verify: `100 - 0 = 100` open qty, and `100 * $15 = $1,500` open value.
*   **Source fields to check:** `ordered_quantity`, `received_quantity`, `unit_price`
*   **PASS criteria:** All values match mock data fields exactly.
*   **FAIL criteria:** Discrepancy in quantities or values.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OP-02: Partially Received PO Line
*   **Test Case ID:** TC-OP-02
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify calculations for a partially received line.
*   **Starting Page:** Search / Open PO view
*   **Test PO / Supplier / Plant:** PO `4500002002`
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Search for PO `4500002002`.
*   **Expected result in app:**
    *   Ordered Qty = `200`
    *   Received Qty = `80`
    *   Open Qty = `120`
    *   Open Value = `$1,800.00`
    *   Status = `PARTIALLY_RECEIVED`
*   **Manual validation method:** Verify: `200 - 80 = 120` open qty, and `120 * $15 = $1,800` open value.
*   **Source fields to check:** `ordered_quantity`, `received_quantity`, `unit_price`
*   **PASS criteria:** Calculations are correct and status is partial.
*   **FAIL criteria:** Open quantity is displayed as 200 or open value is $3,000.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OP-03: Fully Received PO Line
*   **Test Case ID:** TC-OP-03
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify fully received PO lines are hidden from open lists.
*   **Starting Page:** Dashboard / Open PO List
*   **Test PO / Supplier / Plant:** PO `4500002003`
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** 
    1. Search for PO `4500002003` in the Open PO drill-down list.
    2. Try to locate it.
*   **Expected result in app:** PO `4500002003` does not appear in the active open PO list.
*   **Manual validation method:** Check if the line has `received_quantity` == `ordered_quantity` (150 == 150), meaning `open_quantity` is 0.
*   **Source fields to check:** `ordered_quantity`, `received_quantity`
*   **PASS criteria:** Excluded from open PO list.
*   **FAIL criteria:** Included in the open list.
*   **Priority:** High
*   **Notes:** Closed/fully received lines belong to historical reporting only.

---

### TC-OP-04: Deleted PO Line
*   **Test Case ID:** TC-OP-04
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify deleted lines are excluded from open lists.
*   **Starting Page:** Open PO List
*   **Test PO / Supplier / Plant:** PO `4500002015`
*   **Pre-condition:** Line is marked `DELETED`.
*   **Steps for me to perform:** Look for PO `4500002015` in the active open PO list.
*   **Expected result in app:** Not visible.
*   **Manual validation method:** Confirm `deletion_completion_indicator` is `DELETED`.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Line is hidden from active dashboard counts and lists.
*   **FAIL criteria:** Line shows up as active.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-OP-05: Completed / Closed PO Line
*   **Test Case ID:** TC-OP-05
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify closed lines are excluded.
*   **Starting Page:** Open PO List
*   **Test PO / Supplier / Plant:** PO `4500002016`
*   **Pre-condition:** Line is completed.
*   **Steps for me to perform:** Check if PO `4500002016` is in open lists.
*   **Expected result in app:** Not visible.
*   **Manual validation method:** Confirm `deletion_completion_indicator` is `COMPLETED`.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Hidden from open lists.
*   **FAIL criteria:** Visible in active lists.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OP-06: Cancelled PO Line with Open Quantity
*   **Test Case ID:** TC-OP-06
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Ensure deleted flag overrides remaining open quantity.
*   **Starting Page:** Open PO List
*   **Test PO / Supplier / Plant:** PO `4500002027`
*   **Pre-condition:** `deletion_completion_indicator` == `DELETED`, but `ordered_quantity` = 100 and `received_quantity` = 0.
*   **Steps for me to perform:** Check if PO `4500002027` appears in open PO lines.
*   **Expected result in app:** Excluded.
*   **Manual validation method:** Ensure the system does not count the 100 units or $1,500 open value because the line is cancelled.
*   **Source fields to check:** `deletion_completion_indicator`, `open_quantity`
*   **PASS criteria:** Excluded from active count and value.
*   **FAIL criteria:** Counted as open.
*   **Priority:** High
*   **Notes:** Important SAP data integrity rule.

---

### TC-OP-07: Service PO Line
*   **Test Case ID:** TC-OP-07
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify service PO rendering (in EUR).
*   **Starting Page:** Search / Open PO List
*   **Test PO / Supplier / Plant:** PO `4500002019`
*   **Pre-condition:** Service PO line.
*   **Steps for me to perform:** View PO `4500002019`.
*   **Expected result in app:** Shows value in `EUR` (75,000 EUR) and status `OPEN`.
*   **Manual validation method:** Compare with mock data currency field.
*   **Source fields to check:** `currency`, `unit_price`, `material_service_description`
*   **PASS criteria:** Displays EUR currency correctly.
*   **FAIL criteria:** Displays USD or incorrect value.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-OP-08: Material PO Line
*   **Test Case ID:** TC-OP-08
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify material PO rendering.
*   **Starting Page:** Search
*   **Test PO / Supplier / Plant:** PO `4500002001`
*   **Pre-condition:** Material PO line.
*   **Steps for me to perform:** Search for PO `4500002001`.
*   **Expected result in app:** Shows material ID `Microprocessor Core v1` and quantity units `pcs`.
*   **Manual validation method:** Check source text.
*   **Source fields to check:** `material_service_description`
*   **PASS criteria:** Matches source description.
*   **FAIL criteria:** Empty description or service layout used.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-OP-09: PO with Zero Open Quantity
*   **Test Case ID:** TC-OP-09
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify PO line with zero open quantity is excluded from open metrics.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** PO `4500002012`
*   **Pre-condition:** `open_quantity` = 0.
*   **Steps for me to perform:** Search for PO `4500002012` in open PO lists.
*   **Expected result in app:** Not found.
*   **Manual validation method:** Confirm `open_quantity` == 0.
*   **Source fields to check:** `open_quantity`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** High
*   **Notes:** Invoice is blocked but PO delivery is complete.

---

### TC-OP-10: PO with Negative or Invalid Quantity
*   **Test Case ID:** TC-OP-10
*   **Test Area:** Open PO Line Testing
*   **Test Objective:** Verify invalid/negative quantity is caught.
*   **Starting Page:** Dashboard / Data Quality exceptions
*   **Test PO / Supplier / Plant:** PO `4500002029`
*   **Pre-condition:** `ordered_quantity` = -50.
*   **Steps for me to perform:** Locate PO `4500002029`.
*   **Expected result in app:** Flagged as exception: "Negative Quantity". Excluded from standard open quantity totals.
*   **Manual validation method:** Confirm negative quantity is present.
*   **Source fields to check:** `ordered_quantity`
*   **PASS criteria:** Flagged and excluded from standard sums.
*   **FAIL criteria:** Calculated as a subtraction from open sums.
*   **Priority:** High
*   **Notes:** None.

---

## ⏰ Section 3: Overdue PO Testing

### TC-OV-01: Open PO with Delivery Date Before Today
*   **Test Case ID:** TC-OV-01
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify past-due lines are marked overdue.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002004` (Delivery: May 20, 2026)
*   **Pre-condition:** Current date is June 10, 2026.
*   **Steps for me to perform:** Open Overdue Workbench and search for PO `4500002004`.
*   **Expected result in app:** Displays as "Overdue" by 21 days.
*   **Manual validation method:** Calculate `June 10 - May 20 = 21` days.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Classified as overdue.
*   **FAIL criteria:** Missing from overdue workbench.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-OV-02: Open PO with Delivery Date Today
*   **Test Case ID:** TC-OV-02
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify today's delivery is not marked overdue.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO with delivery date set to current date.
*   **Pre-condition:** Current date is June 10, 2026.
*   **Steps for me to perform:** Verify if today's delivery PO appears in the Overdue Workbench.
*   **Expected result in app:** Does not appear (on track).
*   **Manual validation method:** Confirm `delivery_date` == `2026-06-10`.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Excluded from overdue.
*   **FAIL criteria:** Included in overdue.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OV-03: Open PO with Future Delivery Date
*   **Test Case ID:** TC-OV-03
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify future delivery PO is on track.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002005` (Delivery: July 15, 2026)
*   **Pre-condition:** Date is June 10, 2026.
*   **Steps for me to perform:** Search for PO `4500002005` in Overdue Workbench.
*   **Expected result in app:** Absent.
*   **Manual validation method:** Confirm delivery date is in future.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OV-04: Closed PO with Old Delivery Date
*   **Test Case ID:** TC-OV-04
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Ensure completed lines are not flagged as overdue.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002003` (Delivery: May 15, 2026)
*   **Pre-condition:** Date is June 10, 2026. `open_quantity` = 0.
*   **Steps for me to perform:** Look for PO `4500002003` in Overdue Workbench.
*   **Expected result in app:** Absent.
*   **Manual validation method:** Check if open qty is 0.
*   **Source fields to check:** `delivery_date`, `open_quantity`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OV-05: Deleted PO with Old Delivery Date
*   **Test Case ID:** TC-OV-05
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Ensure deleted lines with old dates are excluded.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002015`
*   **Pre-condition:** `deletion_completion_indicator` == `DELETED`.
*   **Steps for me to perform:** Check if PO `4500002015` appears in Overdue lists.
*   **Expected result in app:** Absent.
*   **Manual validation method:** Confirm deleted status.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-OV-06: Partially Received Overdue PO
*   **Test Case ID:** TC-OV-06
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify overdue status on partially received line.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002002` (Delivery: June 5, 2026)
*   **Pre-condition:** Current date is June 10, 2026. Open qty is 120.
*   **Steps for me to perform:** Search for PO `4500002002` in Overdue Workbench.
*   **Expected result in app:** Appears as overdue by 5 days, showing 120 open units.
*   **Manual validation method:** Calculate `June 10 - June 5 = 5` days.
*   **Source fields to check:** `delivery_date`, `open_quantity`
*   **PASS criteria:** Displays in overdue queue with correct remaining open quantity.
*   **FAIL criteria:** Shows total ordered qty (200) or fails to show as overdue.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OV-07: Fully Received Overdue PO
*   **Test Case ID:** TC-OV-07
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Confirm zero open qty excludes overdue status.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002012` (Delivery: May 10, 2026)
*   **Pre-condition:** Delivery complete, invoice blocked.
*   **Steps for me to perform:** Search for PO `4500002012` in Overdue lists.
*   **Expected result in app:** Absent.
*   **Manual validation method:** Verify `open_quantity` = 0.
*   **Source fields to check:** `delivery_date`, `open_quantity`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** High
*   **Notes:** None.

---

### TC-OV-08: Overdue by Buyer Allocation
*   **Test Case ID:** TC-OV-08
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify overdue lines count by buyer.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Alex Buyer (BUY-01)
*   **Pre-condition:** Date is June 10, 2026.
*   **Steps for me to perform:** Filter Overdue Workbench by buyer "Alex Buyer".
*   **Expected result in app:** Shows exactly 10 overdue lines.
*   **Manual validation method:** Count overdue items for Alex in database.
*   **Source fields to check:** `buyer`, `delivery_date`
*   **PASS criteria:** Filtered count matches 5.
*   **FAIL criteria:** Shows wrong count.
*   **Priority:** Medium
*   **Notes:** Overdue lines for Alex: `2004`, `2009`, `2023`, `2024`, `2026`.

---

### TC-OV-09: Overdue by Plant Allocation
*   **Test Case ID:** TC-OV-09
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify overdue lines count by plant.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Plant PL01
*   **Pre-condition:** Date is June 10, 2026.
*   **Steps for me to perform:** Filter Overdue Workbench by Plant PL01.
*   **Expected result in app:** Displays plant-specific overdue lines.
*   **Manual validation method:** Reconcile count against plant PL01 in mock data.
*   **Source fields to check:** `plant`, `delivery_date`
*   **PASS criteria:** Counts reconcile.
*   **FAIL criteria:** Incorrect count.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-OV-10: Overdue Aging Buckets
*   **Test Case ID:** TC-OV-10
*   **Test Area:** Overdue PO Testing
*   **Test Objective:** Verify overdue lines are sorted into correct aging buckets.
*   **Starting Page:** Dashboard / Overdue Workbench
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Date is June 10, 2026.
*   **Steps for me to perform:** View aging charts or tabs.
*   **Expected result in app:** Lines sorted as:
    *   **1–7 days:** PO `4500002009` (2 days overdue)
    *   **8–15 days:** PO `4500002008` (8 days), PO `4500002024` (9 days)
    *   **16–30 days:** PO `4500002004` (21 days), PO `4500002023` (21 days), PO `4500002022` (26 days), PO `4500002026` (26 days)
*   **Manual validation method:** Compute `June 10 - delivery_date` and compare sorting.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Sorting is mathematically correct.
*   **FAIL criteria:** Mismatches.
*   **Priority:** High
*   **Notes:** Exclude invalid dates (e.g. `2018`).

---

## 📦 Section 4: Goods Receipt (GR) Testing

### TC-GR-01: GR Not Started
*   **Test Case ID:** TC-GR-01
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify line with zero receipt quantity shows as PENDING.
*   **Starting Page:** Search / PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002001`
*   **Pre-condition:** `received_quantity` = 0.
*   **Steps for me to perform:** View PO `4500002001`.
*   **Expected result in app:** GR Status is displayed as `PENDING` or "Not Started".
*   **Manual validation method:** Confirm `received_quantity` is 0.
*   **Source fields to check:** `received_quantity`, `gr_status`
*   **PASS criteria:** Status is pending.
*   **FAIL criteria:** Status is partial or complete.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-GR-02: Partial GR
*   **Test Case ID:** TC-GR-02
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify line with partial receipt quantity shows as PARTIAL.
*   **Starting Page:** Search / PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002002`
*   **Pre-condition:** `received_quantity` = 80, `ordered_quantity` = 200.
*   **Steps for me to perform:** View PO `4500002002`.
*   **Expected result in app:** GR Status is `PARTIAL` or "Partially Received".
*   **Manual validation method:** Confirm `received_quantity` < `ordered_quantity`.
*   **Source fields to check:** `received_quantity`, `ordered_quantity`, `gr_status`
*   **PASS criteria:** Status is partial.
*   **FAIL criteria:** Shows completed or pending.
*   **Priority:** High
*   **Notes:** None.

---

### TC-GR-03: Full GR
*   **Test Case ID:** TC-GR-03
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify line with full receipt quantity shows as COMPLETED.
*   **Starting Page:** Search / PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002003`
*   **Pre-condition:** `received_quantity` = 150, `ordered_quantity` = 150.
*   **Steps for me to perform:** View PO `4500002003`.
*   **Expected result in app:** GR Status is `COMPLETED` or "Fully Received".
*   **Manual validation method:** Confirm quantities match.
*   **Source fields to check:** `received_quantity`, `ordered_quantity`, `gr_status`
*   **PASS criteria:** Status is completed.
*   **FAIL criteria:** Status is partial.
*   **Priority:** High
*   **Notes:** None.

---

### TC-GR-04: Excess GR
*   **Test Case ID:** TC-GR-04
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify over-receipt alerts are triggered.
*   **Starting Page:** Search / Exceptions view
*   **Test PO / Supplier / Plant:** PO `4500002028`
*   **Pre-condition:** `received_quantity` = 120, `ordered_quantity` = 100.
*   **Steps for me to perform:** Search for PO `4500002028`.
*   **Expected result in app:** Displays GR Status as `COMPLETED` but triggers a quantity variance exception warning.
*   **Manual validation method:** Confirm receipt exceeds order.
*   **Source fields to check:** `received_quantity`, `ordered_quantity`, `exception_reason`
*   **PASS criteria:** Quantity variance is flagged.
*   **FAIL criteria:** Accepted silently without warning.
*   **Priority:** High
*   **Notes:** Over-receipts represent an AP audit risk.

---

### TC-GR-05: GR After Delivery Date
*   **Test Case ID:** TC-GR-05
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify late receipt tracking.
*   **Starting Page:** Supplier Analytics
*   **Test PO / Supplier / Plant:** PO `4500002002`
*   **Pre-condition:** Historical delivery date June 5, 2026.
*   **Steps for me to perform:** Check delivery performance logs for the supplier.
*   **Expected result in app:** Flagged as late or impact is visible on supplier's OTD% scorecard.
*   **Manual validation method:** Compare actual receipt timestamp with delivery date.
*   **Source fields to check:** `delivery_date`, `gr_status`
*   **PASS criteria:** Late delivery is captured in KPIs.
*   **FAIL criteria:** Ignored.
*   **Priority:** Low
*   **Notes:** None.

---

### TC-GR-06: GR Missing with Past Delivery Date
*   **Test Case ID:** TC-GR-06
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Validate alert for past-due line with zero receipts.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002024`
*   **Pre-condition:** Delivery date: June 1, 2026. Received: 0.
*   **Steps for me to perform:** Look for PO `4500002024`.
*   **Expected result in app:** Appears as overdue with zero goods received.
*   **Manual validation method:** Confirm overdue criteria and 0 receipts.
*   **Source fields to check:** `delivery_date`, `received_quantity`
*   **PASS criteria:** Flagged in overdue.
*   **FAIL criteria:** Excluded.
*   **Priority:** High
*   **Notes:** None.

---

### TC-GR-07: Received Qty Greater than Ordered Qty (Calculations)
*   **Test Case ID:** TC-GR-07
*   **Test Area:** Goods Receipt Testing
*   **Test Objective:** Verify open quantity calculations for over-receipt.
*   **Starting Page:** Search / PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002028`
*   **Pre-condition:** `received_quantity` = 120, `ordered_quantity` = 100.
*   **Steps for me to perform:** View PO `4500002028`.
*   **Expected result in app:** Open Qty shows `-20` (or 0 depending on system override), and the line is not counted as active open.
*   **Manual validation method:** Verify `100 - 120 = -20`.
*   **Source fields to check:** `open_quantity`
*   **PASS criteria:** Excluded from positive open quantities and open value sums.
*   **FAIL criteria:** System crashes or adds negative values to dashboard spend totals.
*   **Priority:** High
*   **Notes:** Over-received lines are excluded from open PO line counts.

---

## 🧾 Section 5: Invoice / GRIR Testing

### TC-IV-01: Invoice Not Received
*   **Test Case ID:** TC-IV-01
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify invoice status is pending when invoiced quantity is zero.
*   **Starting Page:** PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002001`
*   **Pre-condition:** `invoiced_quantity` = 0.
*   **Steps for me to perform:** View PO `4500002001`.
*   **Expected result in app:** Invoice status is `PENDING`.
*   **Manual validation method:** Confirm invoiced qty is 0.
*   **Source fields to check:** `invoiced_quantity`, `invoice_status`
*   **PASS criteria:** Status is pending.
*   **FAIL criteria:** Shows invoiced.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-IV-02: Invoice Partially Received
*   **Test Case ID:** TC-IV-02
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify invoice status is partial.
*   **Starting Page:** PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002002`
*   **Pre-condition:** `invoiced_quantity` = 80, `ordered_quantity` = 200.
*   **Steps for me to perform:** View PO `4500002002`.
*   **Expected result in app:** Invoice status is `PARTIAL` or "Partially Invoiced".
*   **Manual validation method:** Confirm invoiced < ordered.
*   **Source fields to check:** `invoiced_quantity`, `invoice_status`
*   **PASS criteria:** Status is partial.
*   **FAIL criteria:** Shows completed or pending.
*   **Priority:** High
*   **Notes:** None.

---

### TC-IV-03: Invoice Fully Received
*   **Test Case ID:** TC-IV-03
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify invoice status is complete.
*   **Starting Page:** PO Detail
*   **Test PO / Supplier / Plant:** PO `4500002003`
*   **Pre-condition:** `invoiced_quantity` = 150, `ordered_quantity` = 150.
*   **Steps for me to perform:** View PO `4500002003`.
*   **Expected result in app:** Invoice status is `COMPLETED` or "Fully Invoiced".
*   **Manual validation method:** Confirm quantities match.
*   **Source fields to check:** `invoiced_quantity`, `invoice_status`
*   **PASS criteria:** Status is completed.
*   **FAIL criteria:** Shows partial.
*   **Priority:** High
*   **Notes:** None.

---

### TC-IV-04: Invoice Blocked (Variance)
*   **Test Case ID:** TC-IV-04
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify invoice blocked flag triggers AP block.
*   **Starting Page:** Search / Invoice Review
*   **Test PO / Supplier / Plant:** PO `4500002012`
*   **Pre-condition:** `invoice_blocked_flag` == `Y`.
*   **Steps for me to perform:** Search for PO `4500002012`.
*   **Expected result in app:** Displays invoice status as `INVOICED_BLOCKED` with warning badge.
*   **Manual validation method:** Confirm block flag in source.
*   **Source fields to check:** `invoice_blocked_flag`, `invoice_status`
*   **PASS criteria:** System flags the line as invoice blocked.
*   **FAIL criteria:** Shows as standard invoiced.
*   **Priority:** High
*   **Notes:** None.

---

### TC-IV-05: GR Done but Invoice Missing
*   **Test Case ID:** TC-IV-05
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify alert when GR is completed but invoice is missing.
*   **Starting Page:** Search / Exceptions view
*   **Test PO / Supplier / Plant:** PO `4500002013`
*   **Pre-condition:** `received_quantity` = 250, `invoiced_quantity` = 0.
*   **Steps for me to perform:** Search for PO `4500002013`.
*   **Expected result in app:** Displays exception note: "GR Done, Invoice Missing".
*   **Manual validation method:** Confirm GR qty > 0 and invoice qty is 0.
*   **Source fields to check:** `received_quantity`, `invoiced_quantity`, `exception_reason`
*   **PASS criteria:** Exception is correctly flagged.
*   **FAIL criteria:** Ignored.
*   **Priority:** High
*   **Notes:** Represents unbilled liability.

---

### TC-IV-06: Invoice Received Before GR
*   **Test Case ID:** TC-IV-06
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify alert when invoice is posted before physical goods receipt.
*   **Starting Page:** Search / Invoice Blocked queue
*   **Test PO / Supplier / Plant:** PO `4500002014`
*   **Pre-condition:** `invoiced_quantity` = 1000, `received_quantity` = 0.
*   **Steps for me to perform:** Search for PO `4500002014`.
*   **Expected result in app:** Displays exception: "Invoice Before GR (GR/IR Mismatch)".
*   **Manual validation method:** Confirm invoice qty > receipt qty.
*   **Source fields to check:** `invoiced_quantity`, `received_quantity`, `exception_reason`
*   **PASS criteria:** Block is flagged and exception matches.
*   **FAIL criteria:** Accepted as clean invoiced.
*   **Priority:** Critical
*   **Notes:** Major audit compliance issue.

---

### TC-IV-07: Price Variance Block
*   **Test Case ID:** TC-IV-07
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify price variance calculation.
*   **Starting Page:** Invoice Review
*   **Test PO / Supplier / Plant:** PO `4500002012`
*   **Pre-condition:** `price_variance` > 0.
*   **Steps for me to perform:** Open details for PO `4500002012`.
*   **Expected result in app:** Shows price variance amount of `$1,250.00`.
*   **Manual validation method:** Compare with mock data price variance field.
*   **Source fields to check:** `price_variance`
*   **PASS criteria:** Variance matches source.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-IV-08: Quantity Variance Block
*   **Test Case ID:** TC-IV-08
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify quantity variance calculation.
*   **Starting Page:** Invoice Review
*   **Test PO / Supplier / Plant:** PO `4500002014`
*   **Pre-condition:** `quantity_variance` > 0.
*   **Steps for me to perform:** Open details for PO `4500002014`.
*   **Expected result in app:** Shows quantity variance of `1000` units.
*   **Manual validation method:** Compare with source data field.
*   **Source fields to check:** `quantity_variance`
*   **PASS criteria:** Variance matches source.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-IV-09: Currency Mismatch Check
*   **Test Case ID:** TC-IV-09
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify currency mismatch exception is triggered.
*   **Starting Page:** Exceptions view
*   **Test PO / Supplier / Plant:** PO `4500002019`
*   **Pre-condition:** PO in EUR, company code US.
*   **Steps for me to perform:** View PO `4500002019`.
*   **Expected result in app:** Displays warning if currency conflicts with domestic rules.
*   **Manual validation method:** Compare PO currency with company code headquarters rules.
*   **Source fields to check:** `currency`, `company_code`
*   **PASS criteria:** Handles currency difference.
*   **FAIL criteria:** Displays wrong currency symbol or converts value incorrectly.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-IV-10: Invoice Value Exceeds PO Value
*   **Test Case ID:** TC-IV-10
*   **Test Area:** Invoice / GRIR Testing
*   **Test Objective:** Verify alert when invoice value exceeds PO line value.
*   **Starting Page:** Search / Invoice Blocked queue
*   **Test PO / Supplier / Plant:** PO `4500002025`
*   **Pre-condition:** `price_variance` = 5000 EUR.
*   **Steps for me to perform:** Open details for PO `4500002025`.
*   **Expected result in app:** Flags price block warning for high-value variance.
*   **Manual validation method:** Check if block flag is true and price variance is present.
*   **Source fields to check:** `invoice_blocked_flag`, `price_variance`
*   **PASS criteria:** Block is displayed.
*   **FAIL criteria:** Block is missing.
*   **Priority:** High
*   **Notes:** None.

---

## 🤝 Section 6: Supplier Acknowledgement Testing

### TC-AK-01: Acknowledgement Required and Missing
*   **Test Case ID:** TC-AK-01
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Verify missing ack exception is raised.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002006`
*   **Pre-condition:** `acknowledgement_required` == `Y` and `acknowledgement_date` is null.
*   **Steps for me to perform:** Search for PO `4500002006` in Acknowledgement Workbench.
*   **Expected result in app:** Appears as "Missing Confirmation".
*   **Manual validation method:** Confirm required is Y and actual date is null.
*   **Source fields to check:** `acknowledgement_required`, `acknowledgement_date`
*   **PASS criteria:** Listed as missing.
*   **FAIL criteria:** Excluded.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-AK-02: Acknowledgement Required and Received
*   **Test Case ID:** TC-AK-02
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Verify acknowledged lines are marked correctly.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002002`
*   **Pre-condition:** `acknowledgement_date` is not null.
*   **Steps for me to perform:** Search for PO `4500002002` in Acknowledgement lists.
*   **Expected result in app:** Shows status as confirmed/acknowledged, with date `2026-05-03`.
*   **Manual validation method:** Compare actual date with source.
*   **Source fields to check:** `acknowledgement_date`
*   **PASS criteria:** Matches date.
*   **FAIL criteria:** Shows wrong date.
*   **Priority:** High
*   **Notes:** None.

---

### TC-AK-03: Acknowledgement Not Required
*   **Test Case ID:** TC-AK-03
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Ensure no missing ack exception is raised if ack is not required.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002011`
*   **Pre-condition:** `acknowledgement_required` == `N`.
*   **Steps for me to perform:** Check if PO `4500002011` is flagged as missing confirmation.
*   **Expected result in app:** Absent from missing confirmation queues.
*   **Manual validation method:** Confirm required is N.
*   **Source fields to check:** `acknowledgement_required`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Flagged as missing.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-AK-04: Late Acknowledgement Flagged
*   **Test Case ID:** TC-AK-04
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Verify late acknowledgements are flagged historically.
*   **Starting Page:** Supplier Analytics
*   **Test PO / Supplier / Plant:** PO `4500002007`
*   **Pre-condition:** Created May 1, acknowledged May 20.
*   **Steps for me to perform:** Search for PO `4500002007` in supplier confirmation history.
*   **Expected result in app:** Flagged as late confirmation.
*   **Manual validation method:** Confirm difference is greater than 3 days.
*   **Source fields to check:** `po_creation_date`, `acknowledgement_date`
*   **PASS criteria:** Correctly flagged.
*   **FAIL criteria:** Ignored.
*   **Priority:** Low
*   **Notes:** None.

---

### TC-AK-05: High-Value PO Without Acknowledgement
*   **Test Case ID:** TC-AK-05
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Verify critical escalation on high-value missing confirmations.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002010` (Value: $125,000)
*   **Pre-condition:** Value > $50k, missing ack.
*   **Steps for me to perform:** Look for PO `4500002010` in Acknowledgement Workbench.
*   **Expected result in app:** Listed at the top of the queue with `CRITICAL` or `HIGH` severity.
*   **Manual validation method:** Check open value and missing ack.
*   **Source fields to check:** `open_value`, `acknowledgement_date`
*   **PASS criteria:** Prioritized at high severity.
*   **FAIL criteria:** Displayed at low severity.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-AK-06: Overdue PO Without Acknowledgement
*   **Test Case ID:** TC-AK-06
*   **Test Area:** Supplier Acknowledgement Testing
*   **Test Objective:** Verify overdue missing ack exception.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002023`
*   **Pre-condition:** Delivery date passed (May 20, 2026), missing ack.
*   **Steps for me to perform:** Locate PO `4500002023`.
*   **Expected result in app:** Flagged as "Overdue Missing Acknowledgement".
*   **Manual validation method:** Confirm overdue criteria and missing ack.
*   **Source fields to check:** `delivery_date`, `acknowledgement_date`
*   **PASS criteria:** Correct exception flags.
*   **FAIL criteria:** Ignored.
*   **Priority:** High
*   **Notes:** None.

---

## ✉️ Section 7: Reminder and Email Trigger Testing

### TC-EM-01: Reminder Button Visible for Eligible PO
*   **Test Case ID:** TC-EM-01
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify button is visible for overdue/missing ack.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Overdue, missing ack, no recent reminders.
*   **Steps for me to perform:** Click PO `4500002009` and check the detail drawer.
*   **Expected result in app:** "Send Supplier Reminder" button is visible and active.
*   **Manual validation method:** Confirm eligibility from data coverage matrix.
*   **Source fields to check:** Matrix mapping.
*   **PASS criteria:** Button is active.
*   **FAIL criteria:** Button is hidden or disabled.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-02: Reminder Button Hidden for Closed/Deleted PO
*   **Test Case ID:** TC-EM-02
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify button is absent on closed/deleted lines.
*   **Starting Page:** PO detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002015` (deleted) or `4500002016` (completed)
*   **Pre-condition:** Line is inactive.
*   **Steps for me to perform:** Open drawer for PO `4500002015` or `4500002016`.
*   **Expected result in app:** No active buttons. Drawer is read-only.
*   **Manual validation method:** Confirm status in source.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Button is absent.
*   **FAIL criteria:** Button appears and allows clicks.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-EM-03: Reminder Disabled if Recently Sent
*   **Test Case ID:** TC-EM-03
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify rate limit blocks double emails.
*   **Starting Page:** PO detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002008` (Last reminder: June 4, 2026)
*   **Pre-condition:** Current date is June 10, 2026. Rate limit is active.
*   **Steps for me to perform:** Open drawer for PO `4500002008`.
*   **Expected result in app:** Button is disabled or shows "Reminder Sent Recently". Rate limit warning banner visible.
*   **Manual validation method:** Check `last_reminder_date` in source.
*   **Source fields to check:** `last_reminder_date`
*   **PASS criteria:** Double reminder blocked.
*   **FAIL criteria:** Allows clicking and sending.
*   **Priority:** High
*   **Notes:** Rate limiting is critical to avoid spamming suppliers.

---

### TC-EM-04: Send Reminder for Missing Acknowledgement
*   **Test Case ID:** TC-EM-04
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify state transition after sending.
*   **Starting Page:** Acknowledgement Workbench
*   **Test PO / Supplier / Plant:** PO `4500002006`
*   **Pre-condition:** Missing confirmation.
*   **Steps for me to perform:** Click row, click "Request Acknowledgement", preview draft, click "Confirm Send".
*   **Expected result in app:** Drawer updates to show reminder sent. Recommendation moves to "Pending Supplier Response".
*   **Manual validation method:** Check if database has new reminder log.
*   **Source fields to check:** `app-supplier-reminders.json`
*   **PASS criteria:** Recommendation transitions correctly and logs.
*   **FAIL criteria:** Mismatch or fails to save.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-05: Send Reminder for Overdue PO
*   **Test Case ID:** TC-EM-05
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify state transition for overdue reminder.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002024`
*   **Pre-condition:** Overdue, pending GR.
*   **Steps for me to perform:** Open drawer, click "Send Supplier Reminder", click "Confirm Send".
*   **Expected result in app:** Transitions status to pending response.
*   **Manual validation method:** Check database files.
*   **Source fields to check:** `app-supplier-reminders.json`
*   **PASS criteria:** Reconciles.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-06: Email Preview Screen Modal Opens
*   **Test Case ID:** TC-EM-06
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify preview modal renders before dispatch.
*   **Starting Page:** PO drawer
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Clicked send button.
*   **Steps for me to perform:** Click "Send Reminder".
*   **Expected result in app:** Draft modal slides open or overlays the screen.
*   **Manual validation method:** Visual check.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Modal opens.
*   **FAIL criteria:** Sends immediately without preview.
*   **Priority:** High
*   **Notes:** Prevents accidental sends.

---

### TC-EM-07: Email Preview Contains Correct PO Number
*   **Test Case ID:** TC-EM-07
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify PO number injection.
*   **Starting Page:** Email Preview Modal
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Modal is open.
*   **Steps for me to perform:** Read the subject and body text.
*   **Expected result in app:** Displays `4500002010` in subject/body.
*   **Manual validation method:** Match with source.
*   **Source fields to check:** `po_number`
*   **PASS criteria:** Matches exactly.
*   **FAIL criteria:** Shows wrong number or raw tag (e.g. `{po_number}`).
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-08: Email Preview Contains Correct Supplier Name
*   **Test Case ID:** TC-EM-08
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify supplier name injection.
*   **Starting Page:** Email Preview Modal
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Modal is open.
*   **Steps for me to perform:** Read recipient/salutation.
*   **Expected result in app:** Displays `Global Foundry` or contact name.
*   **Manual validation method:** Match with source.
*   **Source fields to check:** `supplier`
*   **PASS criteria:** Matches exactly.
*   **FAIL criteria:** Shows wrong supplier or raw tag.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-09: Email Preview Contains Correct Delivery Date
*   **Test Case ID:** TC-EM-09
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify delivery date injection.
*   **Starting Page:** Email Preview Modal
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Modal is open.
*   **Steps for me to perform:** Read delivery date field in email body.
*   **Expected result in app:** Displays `2026-07-20`.
*   **Manual validation method:** Match with source.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Date matches exactly.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-10: Email Preview Contains Correct Open Quantity/Value
*   **Test Case ID:** TC-EM-10
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify quantity and value injection.
*   **Starting Page:** Email Preview Modal
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Modal is open.
*   **Steps for me to perform:** Read open quantity and value values in email body.
*   **Expected result in app:** Shows `5000 pcs` and `$125,000.00`.
*   **Manual validation method:** Match with source.
*   **Source fields to check:** `open_quantity`, `open_value`
*   **PASS criteria:** Quantities and values match.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-11: Email Preview Contains Correct Buyer/Contact
*   **Test Case ID:** TC-EM-11
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify buyer signature.
*   **Starting Page:** Email Preview Modal
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Modal is open.
*   **Steps for me to perform:** Read the email signature.
*   **Expected result in app:** Displays `Sarah Planner`.
*   **Manual validation method:** Match with source.
*   **Source fields to check:** `buyer`
*   **PASS criteria:** Signature matches.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-12: Confirm Send Updates Reminder Count
*   **Test Case ID:** TC-EM-12
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify database count increments.
*   **Starting Page:** PO Detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Clicked confirm send.
*   **Steps for me to perform:** Check reminder count in PO details after sending.
*   **Expected result in app:** Shows count as `1`.
*   **Manual validation method:** Check `reminder_count` field in mock database.
*   **Source fields to check:** `reminder_count`
*   **PASS criteria:** Value increments by 1.
*   **FAIL criteria:** Count remains 0.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-13: Confirm Send Updates Last Reminder Date
*   **Test Case ID:** TC-EM-13
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify database timestamp updates.
*   **Starting Page:** PO Detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Clicked confirm send on June 10, 2026.
*   **Steps for me to perform:** Open details for PO `4500002009`.
*   **Expected result in app:** Shows last reminder date as `2026-06-10`.
*   **Manual validation method:** Check `last_reminder_date` field in database.
*   **Source fields to check:** `last_reminder_date`
*   **PASS criteria:** Date matches current system date.
*   **FAIL criteria:** Date remains empty or wrong date.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-14: PO Moves to Pending Supplier Response Tab
*   **Test Case ID:** TC-EM-14
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify lifecycle tab transition.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Clicked confirm send.
*   **Steps for me to perform:** Navigate to the "Pending Supplier Response" tab.
*   **Expected result in app:** PO `4500002009` card/row is displayed here.
*   **Manual validation method:** Check tab list rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Present in pending response tab.
*   **FAIL criteria:** Stays in awaiting action tab.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-EM-15: Communication History is Updated
*   **Test Case ID:** TC-EM-15
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify log history entry is written.
*   **Starting Page:** PO detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Clicked confirm send.
*   **Steps for me to perform:** Open the "Communication Logs" section in the drawer.
*   **Expected result in app:** Shows entry: *"June 10, 2026: Email reminder sent to supplier."*
*   **Manual validation method:** Check log database.
*   **Source fields to check:** `app-supplier-reminders.json`
*   **PASS criteria:** History log is present and updated.
*   **FAIL criteria:** Log is missing.
*   **Priority:** High
*   **Notes:** None.

---

### TC-EM-16: Failed Email Send Shows Error (Outlook Disconnect)
*   **Test Case ID:** TC-EM-16
*   **Test Area:** Reminder and Email Trigger Testing
*   **Test Objective:** Verify failed email transmission triggers local mock fallback.
*   **Starting Page:** PO detail drawer
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Enable Outlook mode with incorrect API settings in environment.
*   **Steps for me to perform:** Open drawer, click "Send Supplier Reminder", click "Confirm Send".
*   **Expected result in app:** Alert popup (Toast) displays: *"Outlook connection failed. Logged reminder locally as mock fallback."*
*   **Manual validation method:** Confirm reminder log is written locally to JSON, but no real email is sent.
*   **Source fields to check:** UI toast message and JSON log.
*   **PASS criteria:** Correct toast message is displayed.
*   **FAIL criteria:** UI hangs, crashes, or falsely reports successful Outlook send.
*   **Priority:** Critical
*   **Notes:** Crucial API rate-limiting/error boundary check.

---

## 📋 Section 8: Recommendation/Workbench Testing

### TC-REC-01: Awaiting Action Tab Displays Active Recommendations
*   **Test Case ID:** TC-REC-01
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Verify recommended actions are listed.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Recommendation status is `AWAITING_ACTION` / `RECOMMENDED`.
*   **Steps for me to perform:** Open "Awaiting Action" tab.
*   **Expected result in app:** PO `4500002009` is listed.
*   **Manual validation method:** Verify row presence.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Displayed in tab.
*   **FAIL criteria:** Missing.
*   **Priority:** High
*   **Notes:** None.

---

### TC-REC-02: Pending Supplier Response Tab displays Sent Reminders
*   **Test Case ID:** TC-REC-02
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Verify sent reminders transition.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002008`
*   **Pre-condition:** `last_reminder_date` is populated.
*   **Steps for me to perform:** Navigate to "Pending Supplier Response" tab.
*   **Expected result in app:** PO `4500002008` is listed.
*   **Manual validation method:** Verify row presence.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Listed correctly.
*   **FAIL criteria:** Missing.
*   **Priority:** High
*   **Notes:** None.

---

### TC-REC-03: Resolved/Closed Tab Displays Completed Items (Read-Only)
*   **Test Case ID:** TC-REC-03
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Verify lock state on completed items.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002016`
*   **Pre-condition:** Line completed.
*   **Steps for me to perform:** 
    1. Navigate to "Resolved / Closed" tab.
    2. Click on PO `4500002016`.
*   **Expected result in app:** Drawer shows a lock icon and text: *"🔒 Closed history is read-only."* Action buttons are hidden.
*   **Manual validation method:** Visual check.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Read-only state enforced.
*   **FAIL criteria:** Active action buttons visible.
*   **Priority:** Critical
*   **Notes:** Historical records must not be modifiable.

---

### TC-REC-04: Recommended Action Text Matches Scenario
*   **Test Case ID:** TC-REC-04
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Verify correct text suggestion.
*   **Starting Page:** PO drawer
*   **Test PO / Supplier / Plant:** PO `4500002004` (Overdue)
*   **Pre-condition:** Overdue open line.
*   **Steps for me to perform:** Open details for PO `4500002004`.
*   **Expected result in app:** Suggestions indicate: *"Recommended Action: Send supplier reminder email to secure recovery commitment date."*
*   **Manual validation method:** Match with source guidelines.
*   **Source fields to check:** UI display text.
*   **PASS criteria:** Suggestion is correct.
*   **FAIL criteria:** Suggestion is wrong (e.g. suggests updating SAP price).
*   **Priority:** High
*   **Notes:** None.

---

### TC-REC-05: State Transition on Custom Action
*   **Test Case ID:** TC-REC-05
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Verify state updates on custom action input.
*   **Starting Page:** PO drawer
*   **Test PO / Supplier / Plant:** PO `4500002009`
*   **Pre-condition:** Open line.
*   **Steps for me to perform:** Add a buyer note: *"Contacted rep directly by phone"* and click save.
*   **Expected result in app:** Note is logged in the action log history and saved.
*   **Manual validation method:** Check if note is written to JSON database.
*   **Source fields to check:** `app-actions.json`
*   **PASS criteria:** Log matches input.
*   **FAIL criteria:** Log is empty or fails to save.
*   **Priority:** High
*   **Notes:** None.

---

### TC-REC-06: Recommendations Not Created for Closed/Deleted POs
*   **Test Case ID:** TC-REC-06
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Ensure inactive PO lines do not generate recommendation cards.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002015` (deleted)
*   **Pre-condition:** Reset demo state.
*   **Steps for me to perform:** Check all tabs in the Recommendation Worklist for PO `4500002015`.
*   **Expected result in app:** PO `4500002015` does not appear anywhere as an active recommendation card.
*   **Manual validation method:** Search row list.
*   **Source fields to check:** `app-recommendations.json`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Card generated for deleted PO.
*   **Priority:** High
*   **Notes:** None.

---

### TC-REC-07: Recommendation Priority Score Reconciled
*   **Test Case ID:** TC-REC-07
*   **Test Area:** Recommendation/Workbench Testing
*   **Test Objective:** Reconcile risk severity with priority score.
*   **Starting Page:** Recommendation Worklist
*   **Test PO / Supplier / Plant:** PO `4500002022`
*   **Pre-condition:** High value overdue line.
*   **Steps for me to perform:** Open details for PO `4500002022`.
*   **Expected result in app:** Shows `CRITICAL` risk level and high priority score (>=75).
*   **Manual validation method:** Verify math in [Risk Case TC-RK-01](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement 3 Agent project/buyer-planner-action-workbench/docs/business-validation-test-cases.md).
*   **Source fields to check:** `risk_category`
*   **PASS criteria:** Matches.
*   **FAIL criteria:** Mismatch.
*   **Priority:** Medium
*   **Notes:** None.

---

## 🔍 Section 9: Drill-Down Testing

### TC-DD-01: Open PO Lines Card Drill-down
*   **Test Case ID:** TC-DD-01
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in open drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `Open PO Lines` = 22.
*   **Steps for me to perform:** Click on the "Open PO Lines" KPI card.
*   **Expected result in app:** Navigates to worklist view containing exactly 76 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 76.
*   **FAIL criteria:** Count mismatches or lists completed rows.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-02: Overdue PO Card Drill-down
*   **Test Case ID:** TC-DD-02
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in overdue drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `Overdue PO Lines` = 8.
*   **Steps for me to perform:** Click on the "Overdue PO Lines" card.
*   **Expected result in app:** Navigates to overdue view showing exactly 8 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 8.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-03: Pending ACK Card Drill-down
*   **Test Case ID:** TC-DD-03
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in missing confirmation drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `Pending Acks` = 8.
*   **Steps for me to perform:** Click the "Pending Acks" card.
*   **Expected result in app:** Navigates to Acknowledgement view showing exactly 8 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 8.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-04: Pending GR Card Drill-down
*   **Test Case ID:** TC-DD-04
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in pending GR drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `Pending GR` = 8.
*   **Steps for me to perform:** Click the "Pending GR" card.
*   **Expected result in app:** Navigates to filtered list containing exactly 8 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 8.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-05: Invoice Blocked Card Drill-down
*   **Test Case ID:** TC-DD-05
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in blocked invoice drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `Blocked Invoices` = 4.
*   **Steps for me to perform:** Click the "Blocked Invoices" card.
*   **Expected result in app:** Navigates to list containing exactly 4 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 4.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** Blocked lines: `2012`, `2014`, `2025`, `2028`.

---

### TC-DD-06: High Risk Card Drill-down
*   **Test Case ID:** TC-DD-06
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify row count in high-risk drill-down.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Dashboard showing `High Risk Orders` = 12.
*   **Steps for me to perform:** Click the "High Risk Orders" card.
*   **Expected result in app:** Navigates to list containing exactly 12 rows.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** UI display.
*   **PASS criteria:** Count matches 12.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** Excludes deleted flags.

---

### TC-DD-07: Supplier Drill-down
*   **Test Case ID:** TC-DD-07
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify supplier details match.
*   **Starting Page:** Supplier Analytics
*   **Test PO / Supplier / Plant:** Sterling Electronics
*   **Pre-condition:** Active rows for Sterling.
*   **Steps for me to perform:** Click "Sterling Electronics" in scorecards.
*   **Expected result in app:** Displays details showing only lines belonging to Sterling.
*   **Manual validation method:** Count lines matching Sterling ID.
*   **Source fields to check:** `supplier`
*   **PASS criteria:** Filtered rows match Sterling lines.
*   **FAIL criteria:** Other suppliers' lines leak in.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-08: Buyer Drill-down
*   **Test Case ID:** TC-DD-08
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify buyer details match.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** Alex Buyer (BUY-01)
*   **Pre-condition:** Active rows for Alex.
*   **Steps for me to perform:** Click "Alex Buyer" in segment chart.
*   **Expected result in app:** Displays filtered queue showing only Alex's lines.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** `buyer`
*   **PASS criteria:** Displays only Alex's lines.
*   **FAIL criteria:** Sarah's lines leak in.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DD-09: Plant Drill-down
*   **Test Case ID:** TC-DD-09
*   **Test Area:** Drill-Down Testing
*   **Test Objective:** Verify plant site details match.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** Plant PL01
*   **Pre-condition:** Active rows in PL01.
*   **Steps for me to perform:** Click "Plant PL01" in charts.
*   **Expected result in app:** Displays only lines matching PL01.
*   **Manual validation method:** Count rows.
*   **Source fields to check:** `plant`
*   **PASS criteria:** Displays only PL01 lines.
*   **FAIL criteria:** PL02 or PL03 lines leak in.
*   **Priority:** High
*   **Notes:** None.

---

## 🎛️ Section 10: Filter & Search Testing

### TC-FIL-01: Filter by Supplier
*   **Test Case ID:** TC-FIL-01
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify filtering by supplier updates the workbench.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Global Foundry (VEND-002)
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Select "Global Foundry" from the Supplier dropdown filter.
*   **Expected result in app:** Counts and table rows update to display only Global Foundry lines.
*   **Manual validation method:** Verify that all visible rows have supplier = "Global Foundry".
*   **Source fields to check:** `supplier`
*   **PASS criteria:** Displayed list contains only Global Foundry PO lines.
*   **FAIL criteria:** Other suppliers are displayed.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-02: Filter by Plant
*   **Test Case ID:** TC-FIL-02
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify filtering by plant site works.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Plant PL02
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Select "PL02" from the Plant filter.
*   **Expected result in app:** Shows only PL02 rows.
*   **Manual validation method:** Confirm all displayed rows match PL02.
*   **Source fields to check:** `plant`
*   **PASS criteria:** Filtered rows match PL02.
*   **FAIL criteria:** Mismatch.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-03: Filter by Buyer
*   **Test Case ID:** TC-FIL-03
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify filtering by buyer works.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Sarah Planner (BUY-02)
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Select "Sarah Planner" from the Buyer filter.
*   **Expected result in app:** Shows only Sarah's rows.
*   **Manual validation method:** Verify all rows match buyer.
*   **Source fields to check:** `buyer`
*   **PASS criteria:** Only Sarah's rows visible.
*   **FAIL criteria:** Alex's rows visible.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-04: Filter by Status
*   **Test Case ID:** TC-FIL-04
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify filtering by PO status works.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Status PARTIALLY_RECEIVED
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Select "Partially Received" from the Status filter.
*   **Expected result in app:** Shows only partial deliveries.
*   **Manual validation method:** Confirm status matches.
*   **Source fields to check:** `po_status`
*   **PASS criteria:** Only partial delivery rows display.
*   **FAIL criteria:** Fully open or completed rows display.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-05: Filter by Risk Category
*   **Test Case ID:** TC-FIL-05
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify filtering by risk level.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Risk Category CRITICAL
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Select "Critical" from the Risk filter.
*   **Expected result in app:** Displays only critical risk lines.
*   **Manual validation method:** Match with source risk fields.
*   **Source fields to check:** `risk_category`
*   **PASS criteria:** Only critical risk lines visible.
*   **FAIL criteria:** Low or medium risk lines visible.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-06: Combined Filter (Plant + Supplier)
*   **Test Case ID:** TC-FIL-06
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify additive filters.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** Plant PL02, Supplier Global Foundry
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Apply both PL02 and Global Foundry filters.
*   **Expected result in app:** Shows only lines matching BOTH criteria.
*   **Manual validation method:** Check if rows match both values.
*   **Source fields to check:** `plant`, `supplier`
*   **PASS criteria:** List displays intersection subset.
*   **FAIL criteria:** Displays rows matching only one filter.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-07: Clear Filters
*   **Test Case ID:** TC-FIL-07
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify metrics reset when clear filters is clicked.
*   **Starting Page:** Overdue Workbench (Filtered state)
*   **Test PO / Supplier / Plant:** All
*   **Pre-condition:** Active filters applied.
*   **Steps for me to perform:** Click the **"Clear Filters"** button.
*   **Expected result in app:** All filters reset. Table and counts return to original values.
*   **Manual validation method:** Verify count returns to maximum value (e.g. 76 open PO lines).
*   **Source fields to check:** UI display.
*   **PASS criteria:** Original metrics restored.
*   **FAIL criteria:** Filters remain or data counts stay frozen.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-08: Search by PO Number
*   **Test Case ID:** TC-FIL-08
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify search input for PO numbers.
*   **Starting Page:** Search / Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002010`
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Type `4500002010` in search input.
*   **Expected result in app:** Displays only PO `4500002010`.
*   **Manual validation method:** Confirm row matches.
*   **Source fields to check:** `po_number`
*   **PASS criteria:** Exact row returned.
*   **FAIL criteria:** Wrong row or blank page.
*   **Priority:** High
*   **Notes:** None.

---

### TC-FIL-09: Search by Supplier Name
*   **Test Case ID:** TC-FIL-09
*   **Test Area:** Filter & Search Testing
*   **Test Objective:** Verify search input for supplier name.
*   **Starting Page:** Search / Overdue Workbench
*   **Test PO / Supplier / Plant:** Supplier "Global Foundry"
*   **Pre-condition:** Demo data reset.
*   **Steps for me to perform:** Type `Foundry` in search input.
*   **Expected result in app:** Displays only lines matching Global Foundry.
*   **Manual validation method:** Confirm supplier names.
*   **Source fields to check:** `supplier`
*   **PASS criteria:** Filtered rows match search token.
*   **FAIL criteria:** Unrelated suppliers returned.
*   **Priority:** High
*   **Notes:** None.

---

## 🛑 Section 11: Data Quality Testing

### TC-DQ-01: Missing Delivery Date
*   **Test Case ID:** TC-DQ-01
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of empty/invalid delivery dates.
*   **Starting Page:** Dashboard / Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002018`
*   **Pre-condition:** `delivery_date` = "INVALID_DATE".
*   **Steps for me to perform:** Locate PO `4500002018`.
*   **Expected result in app:** Flagged with a data quality warning: "Invalid delivery date". Excluded from date sorting queues.
*   **Manual validation method:** Confirm value in source database.
*   **Source fields to check:** `delivery_date`, `exception_reason`
*   **PASS criteria:** Flagged and safely handled without system crash.
*   **FAIL criteria:** Causes page crash or returns wrong overdue days.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-02: Missing Supplier ID (Null Value)
*   **Test Case ID:** TC-DQ-02
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of null suppliers.
*   **Starting Page:** Dashboard / Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002030`
*   **Pre-condition:** `supplier` = null.
*   **Steps for me to perform:** Locate PO `4500002030`.
*   **Expected result in app:** Flagged with exception: "Missing Supplier Master".
*   **Manual validation method:** Confirm null field.
*   **Source fields to check:** `supplier`, `exception_reason`
*   **PASS criteria:** Flagged.
*   **FAIL criteria:** Accepted silently or crashes UI.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-03: Missing Buyer ID
*   **Test Case ID:** TC-DQ-03
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of missing buyer.
*   **Starting Page:** Dashboard / Exceptions
*   **Test PO / Supplier / Plant:** PO with null buyer code.
*   **Pre-condition:** `buyer` = null.
*   **Steps for me to perform:** Verify if line displays or defaults to "Unassigned".
*   **Expected result in app:** Shows buyer as "Unassigned" and does not crash.
*   **Manual validation method:** Confirm null buyer in database.
*   **Source fields to check:** `buyer`
*   **PASS criteria:** Defaults gracefully.
*   **FAIL criteria:** UI crash.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-DQ-04: Missing Plant Code
*   **Test Case ID:** TC-DQ-04
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of null plant.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO with null plant.
*   **Pre-condition:** `plant` = null.
*   **Steps for me to perform:** Verify if line displays or defaults to "Unknown Plant".
*   **Expected result in app:** Shows plant as "Unknown" without crashing.
*   **Manual validation method:** Confirm null plant.
*   **Source fields to check:** `plant`
*   **PASS criteria:** Defaults gracefully.
*   **FAIL criteria:** UI crash.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-DQ-05: Missing Unit Price
*   **Test Case ID:** TC-DQ-05
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of null unit price.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO with null unit price.
*   **Pre-condition:** `unit_price` = null.
*   **Steps for me to perform:** Verify if line displays or defaults to $0.00.
*   **Expected result in app:** Open value is calculated as $0.00 without throwing errors.
*   **Manual validation method:** Confirm null price.
*   **Source fields to check:** `unit_price`
*   **PASS criteria:** Defaults to $0.00.
*   **FAIL criteria:** Fails to render or displays raw null/NaN.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-06: Missing Ordered Quantity
*   **Test Case ID:** TC-DQ-06
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of null quantity.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO with null quantity.
*   **Pre-condition:** `ordered_quantity` = null.
*   **Steps for me to perform:** Verify open quantity defaults to 0.
*   **Expected result in app:** Displays ordered quantity as 0 without crashing.
*   **Manual validation method:** Confirm null quantity.
*   **Source fields to check:** `ordered_quantity`
*   **PASS criteria:** Defaults to 0.
*   **FAIL criteria:** UI crash.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-07: Invalid Date Value
*   **Test Case ID:** TC-DQ-07
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify check on corrupt date strings (e.g. "9999-99-99").
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO with corrupt date format.
*   **Pre-condition:** Invalid date format.
*   **Steps for me to perform:** Check if the system flags or safely handles the corrupt string.
*   **Expected result in app:** Renders raw string or flags error. No UI crash.
*   **Manual validation method:** Check source date.
*   **Source fields to check:** `delivery_date`
*   **PASS criteria:** Safe handling.
*   **FAIL criteria:** Crashes.
*   **Priority:** Low
*   **Notes:** None.

---

### TC-DQ-08: Negative Quantity
*   **Test Case ID:** TC-DQ-08
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of negative quantity.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002029`
*   **Pre-condition:** `ordered_quantity` = -50.
*   **Steps for me to perform:** Search for PO `4500002029`.
*   **Expected result in app:** Flagged with "Negative Quantity" exception warning.
*   **Manual validation method:** Check if excluded from standard sums.
*   **Source fields to check:** `ordered_quantity`, `exception_reason`
*   **PASS criteria:** Exception flagged.
*   **FAIL criteria:** Accepted silently.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-09: Received Qty Greater than Ordered Qty
*   **Test Case ID:** TC-DQ-09
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify over-receipt alerts.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002028`
*   **Pre-condition:** `received_quantity` = 120, `ordered_quantity` = 100.
*   **Steps for me to perform:** Search for PO `4500002028`.
*   **Expected result in app:** Flagged with quantity variance exception.
*   **Manual validation method:** Confirm values.
*   **Source fields to check:** `received_quantity`, `ordered_quantity`, `exception_reason`
*   **PASS criteria:** Correct exception flags.
*   **FAIL criteria:** Accepted silently.
*   **Priority:** High
*   **Notes:** None.

---

### TC-DQ-10: Duplicate PO Line Detection
*   **Test Case ID:** TC-DQ-10
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify duplicate detection logic.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002017`
*   **Pre-condition:** Duplicate of `4500002001`.
*   **Steps for me to perform:** Locate PO `4500002017`.
*   **Expected result in app:** Flagged with warning: "Potential Duplicate Order".
*   **Manual validation method:** Check if PO details match another active order.
*   **Source fields to check:** `exception_reason`
*   **PASS criteria:** Warning displayed.
*   **FAIL criteria:** No warning displayed.
*   **Priority:** Low
*   **Notes:** None.

---

### TC-DQ-11: Unknown Status Field Value
*   **Test Case ID:** TC-DQ-11
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of unknown statuses.
*   **Starting Page:** Search
*   **Test PO / Supplier / Plant:** PO with corrupt status value.
*   **Pre-condition:** Corrupt status value.
*   **Steps for me to perform:** Open details for the PO.
*   **Expected result in app:** Defaults to "UNKNOWN" or "UNSPECIFIED" and does not crash.
*   **Manual validation method:** Confirm corrupt status.
*   **Source fields to check:** `po_status`
*   **PASS criteria:** Defaults gracefully.
*   **FAIL criteria:** UI crash.
*   **Priority:** Low
*   **Notes:** None.

---

### TC-DQ-12: Currency Missing
*   **Test Case ID:** TC-DQ-12
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify handling of missing currency.
*   **Starting Page:** PO Detail
*   **Test PO / Supplier / Plant:** PO with null currency field.
*   **Pre-condition:** `currency` = null.
*   **Steps for me to perform:** Verify if currency defaults to "USD".
*   **Expected result in app:** Displays unit prices with "$" or "USD" default symbol.
*   **Manual validation method:** Confirm null currency.
*   **Source fields to check:** `currency`
*   **PASS criteria:** Defaults to USD.
*   **FAIL criteria:** Displays empty currency block or crashes.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-DQ-13: Currency Mismatch
*   **Test Case ID:** TC-DQ-13
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify warning when currency differs.
*   **Starting Page:** Exceptions
*   **Test PO / Supplier / Plant:** PO `4500002019` (EUR)
*   **Pre-condition:** EUR currency in USD-based company code.
*   **Steps for me to perform:** View PO `4500002019`.
*   **Expected result in app:** Displays value in EUR correctly.
*   **Manual validation method:** Compare with source.
*   **Source fields to check:** `currency`
*   **PASS criteria:** Renders EUR correctly.
*   **FAIL criteria:** Mismatch.
*   **Priority:** Medium
*   **Notes:** None.

---

### TC-DQ-14: Deleted Line with Open Quantity
*   **Test Case ID:** TC-DQ-14
*   **Test Area:** Data Quality Testing
*   **Test Objective:** Verify deleted lines are excluded from open PO lines.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** PO `4500002027`
*   **Pre-condition:** `deletion_completion_indicator` == `DELETED`, but `open_quantity` = 100.
*   **Steps for me to perform:** Reconcile Open PO Lines count.
*   **Expected result in app:** Count excludes PO `4500002027`.
*   **Manual validation method:** Ensure it is not counted.
*   **Source fields to check:** `deletion_completion_indicator`, `open_quantity`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included.
*   **Priority:** High
*   **Notes:** None.

---

## 🚀 Section 12: End-to-End Scenarios

### TC-E2E-01: Scenario A (High-Risk Overdue missing ack workflow)
*   **Test Case ID:** TC-E2E-01
*   **Test Area:** End-to-End Scenarios
*   **Test Objective:** Verify full action loop for a critical overdue missing confirmation.
*   **Starting Page:** Dashboard / Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002023`
*   **Pre-condition:** Reset demo state.
*   **Steps for me to perform:**
    1. Reconcile PO `4500002023` is counted on Dashboard in Open PO, Overdue PO, Pending Acks, and High Risk.
    2. Open Overdue Workbench and click PO `4500002023`.
    3. Click **"Send Supplier Reminder"**.
    4. Confirm Send.
*   **Expected result in app:**
    *   PO count and value metrics update.
    *   PO moves from "Awaiting Action" to "Pending Supplier Response".
    *   Reminder log record added in history.
*   **Manual validation method:** Check database files.
*   **Source fields to check:** `app-supplier-reminders.json`, `app-recommendations.json`
*   **PASS criteria:** All status changes and log entries match.
*   **FAIL criteria:** Button is disabled or fails to update lifecycle.
*   **Priority:** Critical
*   **Notes:** None.

---

### TC-E2E-02: Scenario B (Fully Received/Invoiced PO exclusion)
*   **Test Case ID:** TC-E2E-02
*   **Test Area:** End-to-End Scenarios
*   **Test Objective:** Verify completed PO is excluded from all queues.
*   **Starting Page:** Dashboard
*   **Test PO / Supplier / Plant:** PO `4500002016`
*   **Pre-condition:** Fully received and paid.
*   **Steps for me to perform:** Verify if PO `4500002016` shows up in any active workbench.
*   **Expected result in app:** Completely absent from active lists. Read-only historical drawer is shown only if searched directly.
*   **Manual validation method:** Confirm exclusion.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Appears in active dashboard counts.
*   **Priority:** High
*   **Notes:** None.

---

### TC-E2E-03: Scenario C (Deleted PO old delivery date handling)
*   **Test Case ID:** TC-E2E-03
*   **Test Area:** End-to-End Scenarios
*   **Test Objective:** Verify deleted PO is excluded.
*   **Starting Page:** Dashboard / Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002015`
*   **Pre-condition:** Deleted in ERP.
*   **Steps for me to perform:** Confirm PO `4500002015` does not trigger overdue alerts.
*   **Expected result in app:** Excluded.
*   **Manual validation method:** Confirm exclusion.
*   **Source fields to check:** `deletion_completion_indicator`
*   **PASS criteria:** Excluded.
*   **FAIL criteria:** Included in active metrics.
*   **Priority:** High
*   **Notes:** None.

---

### TC-E2E-04: Scenario D (GR Completed but Invoice Blocked)
*   **Test Case ID:** TC-E2E-04
*   **Test Area:** End-to-End Scenarios
*   **Test Objective:** Verify price variance workflow.
*   **Starting Page:** Dashboard / Invoice Review
*   **Test PO / Supplier / Plant:** PO `4500002012`
*   **Pre-condition:** GR complete, invoice price blocked.
*   **Steps for me to perform:**
    1. Confirm PO `4500002012` is not counted in Pending GR.
    2. Confirm it is counted in Blocked Invoices.
    3. Open details and verify the price variance block is displayed.
*   **Expected result in app:** Reconciles correctly.
*   **Manual validation method:** Verify block flag and variance fields.
*   **Source fields to check:** `invoice_blocked_flag`, `price_variance`
*   **PASS criteria:** Price variance block is displayed.
*   **FAIL criteria:** Block is missing or counted as pending GR.
*   **Priority:** High
*   **Notes:** None.

---

### TC-E2E-05: Scenario E (Rate-limiting check on sent reminder)
*   **Test Case ID:** TC-E2E-05
*   **Test Area:** End-to-End Scenarios
*   **Test Objective:** Verify rate limit blocks duplicate reminders.
*   **Starting Page:** Overdue Workbench
*   **Test PO / Supplier / Plant:** PO `4500002008`
*   **Pre-condition:** `last_reminder_date` is June 4, 2026.
*   **Steps for me to perform:**
    1. Open PO `4500002008` in details.
    2. Attempt to click "Send Supplier Reminder".
*   **Expected result in app:** Button is disabled. Warning banner displays last sent date.
*   **Manual validation method:** Confirm rate-limiting.
*   **Source fields to check:** `last_reminder_date`
*   **PASS criteria:** Double transmission blocked.
*   **FAIL criteria:** Allows clicking and sending.
*   **Priority:** High
*   **Notes:** None.
