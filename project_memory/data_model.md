# 📊 Data Model Reference — 26 CSV Files

All files live in `procurement_data_sample/`. Accessed via `readCsv('filename.csv')`.

---

## Primary Transaction Files

| File | Key Fields | Used For | Join Key |
|---|---|---|---|
| `exception_worklist.csv` | `exception_id`, `exception_type`, `severity`, `status`, `po_number`, `item_number`, `supplier_id`, `days_past_due`, `financial_impact_estimate`, `assigned_buyer`, `created_date`, `resolved_date` | **All 2,088 exceptions — the action list** | `po_number + item_number` |
| `purchase_order_headers.csv` | `po_number`, `supplier_id`, `po_date`, `status`, `purchasing_org`, `purchasing_group` | PO header — links supplier to PO | `po_number` |
| `purchase_order_items.csv` | `po_number`, `item_number`, `material_id`, `order_qty`, `net_price`, `plant` | Line-level: price, qty, plant | `po_number + item_number` |
| `po_schedule_lines.csv` | `po_number`, `item_number`, `delivery_date`, `scheduled_qty`, `received_qty`, `open_qty` | Delivery schedules and open quantity | `po_number + item_number` |

---

## Supplier & Master Data

| File | Key Fields | Used For | Join Key |
|---|---|---|---|
| `suppliers.csv` | `supplier_id`, `supplier_name`, `country`, `supplier_tier`, `on_time_delivery_pct`, `quality_ppm`, `risk_score`, `avg_response_days`, `payment_terms`, `incoterms`, `blocked_flag` | All supplier KPIs | `supplier_id` |
| `plants.csv` | `plant`, `plant_name` | Plant code → readable name | `plant` |
| `materials.csv` | `material_id`, `description`, `material_group` | Material master | `material_id` |
| `material_plant.csv` | `material_id`, `plant`, `safety_stock`, `planned_delivery_time_days` | Safety stock + lead time | `material_id + plant` |

---

## Operational Files

| File | Key Fields | Used For | Join Key |
|---|---|---|---|
| `supplier_acknowledgements.csv` | `po_number`, `item_number`, `acknowledgement_status`, `committed_delivery_date`, `buyer_followup_count` | Supplier PO confirmation | `po_number + item_number` |
| `asn_shipments.csv` | `po_number`, `item_number`, `asn_number`, `status`, `carrier`, `ship_date`, `expected_delivery_date` | Advance shipment notifications | `po_number + item_number` |
| `communication_logs.csv` | `po_number`, `direction`, `subject`, `body`, `sent_date`, `sentiment` | Email/portal message history | `po_number` |
| `goods_receipts.csv` | `po_number`, `item_number`, `posting_date`, `received_qty` | Actual delivery receipts | `po_number + item_number` |
| `inventory_stock.csv` | `material_id`, `plant`, `unrestricted_stock` | Current on-hand stock | `material_id + plant` |
| `mrp_elements.csv` | `material_id`, `plant`, `element_type`, `date`, `quantity` | MRP planning (POITEM / RESERVATION) | `material_id + plant` |
| `agent_recommendations.csv` | `exception_id`, `recommended_action`, `draft_subject`, `draft_message`, `confidence_score` | Pre-computed AI recommendations | `exception_id` |
| `ctb_snapshots.csv` | `material_id`, `plant`, `ctb_date`, `capable_to_build` | Capable-to-build flags | `material_id + plant` |

---

## Reference Files (7 more)

| File | Used For |
|---|---|
| `source_list.csv` | Approved source list (supplier-material relationships) |
| `purchasing_info_records.csv` | Price history and lead times per supplier-material |
| `quality_inspections.csv` | Inspection results and defect counts |
| `quality_notifications.csv` | Quality issue notifications |
| `vendor_evaluation.csv` | Formal vendor scores |
| `contract_items.csv` | Contract details |
| `capacity_overview.csv` | Supplier capacity data |

---

## Key Join Patterns

```typescript
// Fast O(1) lookup — always use Maps, never nested loops

// Supplier lookup
const suppliersMap = new Map<string, any>();
for (const s of await readCsv('suppliers.csv')) {
  suppliersMap.set(s.supplier_id, s);
}

// PO item lookup
const itemsMap = new Map<string, any>();
for (const item of await readCsv('purchase_order_items.csv')) {
  itemsMap.set(`${item.po_number}_${item.item_number}`, item);
}

// Usage
const supplier = suppliersMap.get(exception.supplier_id);
const item = itemsMap.get(`${exception.po_number}_${exception.item_number}`);
```

---

## Exception Types in `exception_worklist.csv`

| Type | Meaning |
|---|---|
| `PO_OVERDUE` | Past delivery date, not fully received |
| `ACK_MISSING` | Supplier hasn't confirmed the PO |
| `SUPPLIER_COMMIT_LATE` | Supplier ack'd but committed date is past |
| `DELETION_FLAG_ACTIVE` | PO marked for deletion but still has open qty |

## Exception Statuses

| Status | Meaning |
|---|---|
| `NEW` | Just identified |
| `IN_REVIEW` | Buyer is working it |
| `ACTION_DRAFTED` | Recommendation generated |
| `RESOLVED` | Closed |
