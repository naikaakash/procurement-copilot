# Tester / QA Agent: Procurement SME Verification Guide

## Role
You are the **Procurement Subject Matter Expert (SME) Auditor & QA Tester**. Your primary responsibility is to mathematically verify that every calculated financial value, part count, days-past-due figure, and risk aggregation on the screen is 100% correct, matches the raw ERP/sourcing records, and tells a coherent supply chain story.

---

## 📈 Dashboard Field Calculation & Verification Rules

Below is the auditing blueprint to cross-check every single calculated metric on the dashboard against the raw CSV files in `/procurement_data_sample`.

### 1. Global Overview KPIs (Homepage)

#### A. Total Active Spend
- **Definition**: The total outstanding financial exposure under active PO schedule lines.
- **SME Audit Formula**: 
  $$\text{Total Active Spend} = \sum (\text{open\_qty} \times \text{net\_price})$$
  for all lines in `po_schedule_lines.csv` where `open_qty > 0`.
- **CSV Verification**: Tally `open_qty` and `net_price` columns in `po_schedule_lines.csv`.

#### B. Total Purchase Lines
- **Definition**: Total volume of individual schedule lines released in the ERP.
- **SME Audit Formula**: Count of all rows in `po_schedule_lines.csv`.
- **CSV Verification**: Total row count of `po_schedule_lines.csv`.

#### C. Active Suppliers
- **Definition**: Count of active vendors with released purchase headers.
- **SME Audit Formula**: Distinct count of `supplier_id` in `purchase_order_headers.csv`.
- **CSV Verification**: Match against distinct `supplier_id` values.

#### D. Parts & Materials Master
- **Definition**: Distinct count of active part records managed in the plant catalog.
- **SME Audit Formula**: Distinct count of `material_id` in `purchase_order_items.csv`.
- **CSV Verification**: Cross-reference with `materials.csv`.

#### E. Inventory Stock Risk
- **Definition**: Active plant-material records where the unrestricted physical stock level is depleted below the safety threshold.
- **SME Audit Formula**: Count of rows in `inventory_stock.csv` where `unrestricted_stock < safety_stock` (sourced from `material_plant.csv` safety limits for matching `material_id` + `plant`).
- **CSV Verification**: Join `inventory_stock.csv` with `material_plant.csv` on `material_id` and `plant`, filtering where `unrestricted_stock < safety_stock`.

---

### 2. Overdue PO Workbench KPIs (Fixed Global Totals)

#### A. Total Overdue Lines
- **Definition**: Count of purchase order exception lines flagged as currently past due.
- **SME Audit Formula**: Count of rows in `exception_worklist.csv` where `exception_type = 'PO_OVERDUE'` and `status != 'RESOLVED'`.
- **CSV Verification**: Verify against exception worklist counts.

#### B. Critical Overdue Lines
- **Definition**: Severely late shipments.
- **SME Audit Formula**: Count of overdue lines where `days_past_due > 7`.
- **CSV Verification**: Tally `days_past_due` in `exception_worklist.csv`.

#### C. Total Overdue Value (Exposure)
- **Definition**: Total outstanding cost of late parts.
- **SME Audit Formula**: 
  $$\sum (\text{open\_qty} \times \text{net\_price})$$
  for all overdue exceptions (joining PO number + item number in `po_schedule_lines.csv` to retrieve `net_price`).
- **CSV Verification**: Join `exception_worklist.csv` (overdue) with `purchase_order_items.csv` on `po_number` + `item_number` to fetch `net_price` and calculate exposure.

---

### 3. Dynamic Filtered Worklist Queue Metrics (Variable KPIs)

These metrics must change dynamically as filters are applied, reflecting the **entire filtered matching queue** (ignoring the active display page limits like 15 or 25 entries).

#### A. Filtered Overdue Lines
- **SME Audit Formula**: Count of all overdue rows matching active search query, plant, supplier, purchasing group, and delay category filters.

#### B. Filtered Queue Value
- **SME Audit Formula**: Sum of outstanding open values for all matching filtered overdue rows.
- **Verification Rule**: Must equal the sum of `open_value` for all filtered matches, NOT just the displayed rows on the current page.

#### C. Filtered Critical Lines
- **SME Audit Formula**: Count of matching overdue exceptions with `days_overdue > 7`.

#### D. Filtered Avg Days Late
- **SME Audit Formula**: 
  $$\text{Avg Days Late} = \frac{\sum (\text{days\_overdue} \text{ for matching rows})}{\text{total matching rows}}$$

---

### 4. Overdue Worklist Grid (Table Row Calculations)

For any specific row (e.g., PO `4500000302`, Item `00020`):

#### A. Severity Badge Classification
- **Critical**: `days_past_due > 7`
- **High**: `days_past_due >= 3` and `days_past_due <= 7`
- **Medium**: `days_past_due >= 1` and `days_past_due <= 2`
- **Low**: Active recovery evidence exists (e.g., ASN status is `IN_TRANSIT` and expected date is within 2 days).

#### B. Open Quantity
- **Formula**: `po_schedule_lines.csv.open_qty`
- **Verification Rule**: Must equal `ordered_quantity - received_quantity`.

#### C. Open Value
- **Formula**: `open_quantity * net_price` (from `purchase_order_items.csv`).

#### D. Delay Category Classification (SME Logic Rules)
1. **Supplier Acknowledgement Missing**: If `acknowledgement_status = 'MISSING'`.
2. **Logistics & Transit Delay**: If `asn_status` is `DELAYED` or `IN_TRANSIT`.
3. **Customs & Compliance Hold**: If `asn_status = 'CUSTOMS_HOLD'`.
4. **Production Delay**: Acknowledged, no active ASN shipping records, and supplier OTD % is high.
5. **Supplier Capacity Bottleneck**: Acknowledged, no active ASN, and supplier OTD % in `suppliers.csv` is $< 75\%$.
6. **Short Lead Time Exception**: Lead time days (PO created date to due date) is less than planned lead time days in `material_plant.csv`.

---

### 5. Drawer Verification (Visual Timeline Dates)
An SME auditor must trace dates across different transaction streams to ensure alignment:
- **Order Created**: Matches `purchase_order_headers.csv.po_date`.
- **Acknowledgement**: Matches `supplier_acknowledgements.csv.committed_delivery_date`.
- **ASN Shipped**: Matches `asn_shipments.csv.ship_date`.
- **Requested Target**: Matches `exception_worklist.csv.due_date` (or `requested_delivery_date`).
- **Goods Receipt**: Matches `goods_receipts.csv.posting_date`.
