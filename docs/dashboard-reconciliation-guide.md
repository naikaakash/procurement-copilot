# 📊 Dashboard Reconciliation Guide

This guide describes how to reconcile the core metrics shown on the **Executive Overview Dashboard** against the expanded 60-PO source dataset (`data/mock-po-data.json`). It provides formulas, exact filter criteria, and row-by-row lists of inclusions and exclusions.

---

## 📌 Dataset Summary Reference
Our dataset contains **60 unique purchase orders** and **100 individual PO lines**.

*   **Total PO lines in database:** 100
*   **Total unique POs in database:** 60

---

## 🧮 KPI Reconciliations

### 1. Total POs Count
*   **Definition:** Count of unique purchase order numbers in the system.
*   **Formula:** `Count(Distinct(po_number))` across all rows.
*   **Inclusions:** All rows.
*   **Exclusions:** Duplicate rows with the same `po_number` (e.g., multi-line POs count as 1 PO).
*   **Manual Reconciliation:** Distinct count of POs is exactly **60**.
*   **Reconciled Value:** **60**

### 2. Total PO Lines
*   **Definition:** Total count of physical line items in the ERP system.
*   **Formula:** `Count(po_number + item_number)`.
*   **Inclusions:** All rows.
*   **Exclusions:** None.
*   **Manual Reconciliation:** Count every item record in the JSON array.
*   **Reconciled Value:** **100**

### 3. Open PO Lines Count
*   **Definition:** Count of line items currently active and awaiting full delivery.
*   **Formula:** Count where `deletion_completion_indicator` == `ACTIVE_OPEN` AND `open_quantity` > 0.
*   **Reconciled Value:** **76**
*   **Inclusions:** 4500002001-00010, 4500002001-00020, 4500002001-00030, 4500002002-00010, 4500002002-00020, 4500002002-00030, 4500002002-00040, 4500002004-00010, 4500002004-00020, 4500002004-00030, 4500002005-00010, 4500002005-00020, 4500002005-00030, 4500002006-00010, 4500002006-00020, 4500002006-00030, 4500002007-00010, 4500002008-00010, 4500002008-00020, 4500002009-00010, 4500002010-00010, 4500002010-00020, 4500002010-00030, 4500002011-00010, 4500002011-00020, 4500002011-00030, 4500002014-00010, 4500002017-00010, 4500002018-00010, 4500002019-00010, 4500002019-00020, 4500002019-00030, 4500002019-00040, 4500002020-00010, 4500002021-00010, 4500002021-00020, 4500002021-00030, 4500002021-00040, 4500002022-00010, 4500002022-00020, 4500002022-00030, 4500002022-00040, 4500002023-00010, 4500002024-00010, 4500002026-00010, 4500002026-00020, 4500002026-00030, 4500002030-00010, 4500002031-00010, 4500002031-00020, 4500002031-00030, 4500002032-00010, 4500002033-00010, 4500002034-00010, 4500002034-00020, 4500002034-00030, 4500002034-00040, 4500002035-00010, 4500002036-00010, 4500002037-00010, 4500002038-00010, 4500002039-00010, 4500002042-00010, 4500002046-00010, 4500002047-00010, 4500002049-00010, 4500002050-00010, 4500002051-00010, 4500002052-00010, 4500002055-00010, 4500002056-00010, 4500002056-00040, 4500002057-00010, 4500002058-00010, 4500002059-00010, 4500002060-00010
*   **Exclusions:** 4500002003-00010 (Completed), 4500002012-00010 (Qty=0), 4500002012-00020 (Qty=0), 4500002012-00030 (Qty=0), 4500002013-00010 (Qty=0), 4500002015-00010 (Deleted), 4500002016-00010 (Completed), 4500002025-00010 (Qty=0), 4500002027-00010 (Deleted), 4500002028-00010 (Qty=-20), 4500002029-00010 (Qty=0), 4500002040-00010 (Completed), 4500002040-00020 (Completed), 4500002040-00030 (Completed), 4500002041-00010 (Completed), 4500002043-00010 (Qty=0), 4500002044-00010 (Qty=0), 4500002044-00020 (Qty=0), 4500002045-00010 (Qty=0), 4500002048-00010 (Completed), 4500002053-00010 (Deleted), 4500002054-00010 (Completed), 4500002056-00020 (Completed), 4500002056-00030 (Deleted)

### 4. Open PO Value (USD Equivalent)
*   **Definition:** Sum of open value for all active open PO lines.
*   **Formula:** `Sum(open_value)` where `deletion_completion_indicator` == `ACTIVE_OPEN` and `open_quantity` > 0.
*   **Reconciled Total:** **$1,592,110.00**
*   **Note:** Multi-currency items (e.g., EUR) are converted to USD in frontend queries. For direct JSON field summation, the value is $1592110.00.

### 5. Overdue PO Count
*   **Definition:** Count of active open PO lines with a delivery date before today (2026-06-10).
*   **Formula:** Count where `delivery_date` < `2026-06-10` AND `open_quantity` > 0 AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Reconciled Value:** **23**
*   **Inclusions:** 4500002004-00010, 4500002004-00020, 4500002004-00030, 4500002008-00010, 4500002008-00020, 4500002009-00010, 4500002020-00010, 4500002022-00010, 4500002022-00020, 4500002022-00030, 4500002022-00040, 4500002023-00010, 4500002024-00010, 4500002026-00010, 4500002026-00020, 4500002026-00030, 4500002035-00010, 4500002036-00010, 4500002037-00010, 4500002038-00010, 4500002039-00010, 4500002046-00010, 4500002055-00010

### 6. Overdue PO Value
*   **Definition:** Financial value of all overdue materials.
*   **Formula:** `Sum(open_value)` of all overdue lines identified above.
*   **Reconciled Total:** **$211,950.00**

### 7. Pending Acknowledgement Count
*   **Definition:** Count of open PO lines where supplier confirmation is required but missing.
*   **Formula:** Count where `acknowledgement_required` == `Y` AND `acknowledgement_date` == `null` AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Reconciled Value:** **14**
*   **Inclusions:** 4500002006-00010, 4500002006-00020, 4500002006-00030, 4500002008-00010, 4500002009-00010, 4500002010-00010, 4500002010-00020, 4500002010-00030, 4500002017-00010, 4500002018-00010, 4500002021-00010, 4500002023-00010, 4500002029-00010, 4500002030-00010

### 8. Pending Goods Receipt Count
*   **Definition:** Count of open PO lines whose delivery date has passed or is today, but no goods receipt has been posted.
*   **Formula:** Count where `gr_status` == `PENDING` AND `delivery_date` <= `2026-06-10` AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Reconciled Value:** **22**
*   **Inclusions:** 4500002004-00010, 4500002004-00020, 4500002004-00030, 4500002008-00010, 4500002008-00020, 4500002009-00010, 4500002020-00010, 4500002022-00010, 4500002022-00020, 4500002022-00030, 4500002022-00040, 4500002023-00010, 4500002024-00010, 4500002026-00010, 4500002026-00020, 4500002026-00030, 4500002035-00010, 4500002036-00010, 4500002037-00010, 4500002038-00010, 4500002039-00010, 4500002055-00010

### 9. Invoice Blocked Count
*   **Definition:** Count of lines blocked in Accounts Payable due to variances.
*   **Formula:** Count where `invoice_blocked_flag` == `Y`.
*   **Reconciled Value:** **8**
*   **Inclusions:** 4500002012-00010, 4500002012-00020, 4500002012-00030, 4500002014-00010, 4500002025-00010, 4500002028-00010, 4500002045-00010, 4500002046-00010

### 10. High-Risk PO Count
*   **Definition:** Count of active PO lines identified as `HIGH` or `CRITICAL` risk.
*   **Formula:** Count where `risk_category` IN (`HIGH`, `CRITICAL`) AND `deletion_completion_indicator` == `ACTIVE_OPEN`.
*   **Reconciled Value:** **18**
*   **Inclusions:** 4500002004-00010, 4500002008-00010, 4500002010-00010, 4500002010-00020, 4500002014-00010, 4500002018-00010, 4500002020-00010, 4500002022-00010, 4500002022-00020, 4500002023-00010, 4500002025-00010, 4500002026-00010, 4500002028-00010, 4500002029-00010, 4500002030-00010, 4500002036-00010, 4500002037-00010, 4500002038-00010

### 11. Exception Counts by Segment (Supplier / Plant / Buyer)
*   **Definition:** Number of active exception lines assigned to each segment.
*   **Formula:** Count of active lines where `exception_reason` != `"None"`.

#### Active Exceptions by Buyer:
*   **Alex Buyer (BUY-01)**: 30 exceptions
*   **Sarah Planner (BUY-02)**: 13 exceptions
*   **John Senior (BUY-03)**: 8 exceptions
*   **Michael Lead (BUY-04)**: 2 exceptions
*   **Unknown Buyer**: 1 exceptions

#### Active Exceptions by Plant:
*   **PL01**: 39 exceptions
*   **PL02**: 11 exceptions
*   **PL03**: 3 exceptions
*   **Unknown Plant**: 1 exceptions

#### Active Exceptions by Supplier:
*   **Sterling Electronics (VEND-001)**: 32 exceptions
*   **Global Foundry (VEND-002)**: 10 exceptions
*   **Consulting Group (VEND-003)**: 3 exceptions
*   **Unknown Supplier**: 1 exceptions
*   **Apex Components (VEND-004)**: 6 exceptions
*   **Nova Systems (VEND-005)**: 1 exceptions
*   **Vector Logistics (VEND-006)**: 1 exceptions
