# 📋 Manual Testing Checklist

Use this checklist to track your progress during manual end-to-end verification of the **Supplier Commitment Control Center**. All check items map directly to detailed test cases in the [Manual Business Testing Guide](file:///c:/Users/Aalok/Desktop/AI%20Projects/Procurement%203%20Agent%20project/buyer-planner-action-workbench/docs/manual-business-testing-guide.md).

---

## 🎛️ 1. Dashboard KPI Validation
- [ ] **TC-KPI-01:** Total PO Count (Verify value matches 60 unique POs)
- [ ] **TC-KPI-02:** Total PO Line Count (Verify value matches 100 lines)
- [ ] **TC-KPI-03:** Open PO Line Count (Verify value matches 76 open lines)
- [ ] **TC-KPI-04:** Open PO Value (Verify sum is $1,592,110.00 depending on exchange rate conversion)
- [ ] **TC-KPI-05:** Overdue PO Count (Verify count matches 23 past-due open lines)
- [ ] **TC-KPI-06:** Overdue PO Value (Verify sum is $211,950.00)
- [ ] **TC-KPI-07:** Pending Acknowledgement Count (Verify value matches 14 missing-ack lines)
- [ ] **TC-KPI-08:** Pending Goods Receipt Count (Verify value matches 22 lines)
- [ ] **TC-KPI-09:** Invoice Blocked Count (Verify count matches 8 lines)
- [ ] **TC-KPI-10:** High-Risk PO Count (Verify count matches 18 active high-risk lines)
- [ ] **TC-KPI-11:** Supplier Exception Count (Verify exception totals segment by supplier)
- [ ] **TC-KPI-12:** Buyer Exception Count (Verify exception totals segment by buyer)
- [ ] **TC-KPI-13:** Plant Exception Count (Verify exception totals segment by plant site)

---

## 📂 2. Open PO Line Testing
- [ ] **TC-OP-01:** Fully Open PO Line (PO `4500002001` shows open quantity 100 / open value $1,500)
- [ ] **TC-OP-02:** Partially Received PO Line (PO `4500002002` shows open quantity 120 / open value $1,800)
- [ ] **TC-OP-03:** Fully Received PO Line (PO `4500002003` is excluded from open counts)
- [ ] **TC-OP-04:** Deleted PO Line (PO `4500002015` shows 0 open quantity and is excluded)
- [ ] **TC-OP-05:** Completed / Closed PO Line (PO `4500002016` shows 0 open quantity and is excluded)
- [ ] **TC-OP-06:** Cancelled PO Line with Open Quantity (PO `4500002027` is excluded from open counts)
- [ ] **TC-OP-07:** Service PO Line (PO `4500002019` displays 1 open unit and is in EUR)
- [ ] **TC-OP-08:** Material PO Line (PO `4500002001` renders correctly with material ID and description)
- [ ] **TC-OP-09:** PO with Zero Open Quantity (PO `4500002012` is excluded from open counts)
- [ ] **TC-OP-10:** PO with Negative or Invalid Quantity (PO `4500002029` is flagged for data quality correction)

---

## ⏰ 3. Overdue PO Testing
- [ ] **TC-OV-01:** Open PO with Delivery Date Before Today (PO `4500002004` is flagged as overdue)
- [ ] **TC-OV-02:** Open PO with Delivery Date Today (PO delivery date matching current date is on track)
- [ ] **TC-OV-03:** Open PO with Future Delivery Date (PO `4500002005` is on track)
- [ ] **TC-OV-04:** Closed PO with Old Delivery Date (PO `4500002003` is excluded from overdue counts)
- [ ] **TC-OV-05:** Deleted PO with Old Delivery Date (PO `4500002015` is excluded from overdue counts)
- [ ] **TC-OV-06:** Partially Received Overdue PO (PO `4500002002` - Wait, is it overdue? June 5, 2026 delivery, open quantity 120 - yes, overdue)
- [ ] **TC-OV-07:** Fully Received Overdue PO (PO `4500002003` - excluded)
- [ ] **TC-OV-08:** Overdue by Buyer Allocation (Verify Alex has 10 overdue lines)
- [ ] **TC-OV-09:** Overdue by Plant Allocation (Verify Plant PL01 has 15 overdue lines)
- [ ] **TC-OV-10:** Overdue Aging Buckets Reconciled (Verify counts in 1-7, 8-15, 16-30, and 30+ day categories)

---

## 📦 4. Goods Receipt (GR) Testing
- [ ] **TC-GR-01:** GR Not Started (PO `4500002001` shows received quantity 0 / GR status "PENDING")
- [ ] **TC-GR-02:** Partial GR (PO `4500002002` shows received quantity 80 / GR status "PARTIAL")
- [ ] **TC-GR-03:** Full GR (PO `4500002003` shows received quantity 150 / GR status "COMPLETED")
- [ ] **TC-GR-04:** Excess GR (PO `4500002028` shows received quantity 120 vs ordered 100 / triggers warning)
- [ ] **TC-GR-05:** GR After Delivery Date (PO `4500002002` received quantity posted after delivery date - historical check)
- [ ] **TC-GR-06:** GR Missing with Past Delivery Date (PO `4500002024` shows 0 received / flagged as missing GR)
- [ ] **TC-GR-07:** Received Qty Greater than Ordered Qty (PO `4500002028` flagged as quantity over-receipt)

---

## 🧾 5. Invoice / GRIR Testing
- [ ] **TC-IV-01:** Invoice Not Received (PO `4500002001` shows invoiced quantity 0 / status "PENDING")
- [ ] **TC-IV-02:** Invoice Partially Received (PO `4500002002` shows invoiced quantity 80 / status "PARTIAL")
- [ ] **TC-IV-03:** Invoice Fully Received (PO `4500002003` shows invoiced quantity 150 / status "COMPLETED")
- [ ] **TC-IV-04:** Invoice Blocked (PO `4500002012` has invoice_blocked_flag = "Y" / status "INVOICED_BLOCKED")
- [ ] **TC-IV-05:** GR Done but Invoice Missing (PO `4500002013` has received quantity 250, invoiced quantity 0)
- [ ] **TC-IV-06:** Invoice Received Before GR (PO `4500002014` shows invoiced quantity 1000, received quantity 0)
- [ ] **TC-IV-07:** Price Variance Block (PO `4500002012` shows price variance of $1,250)
- [ ] **TC-IV-08:** Quantity Variance Block (PO `4500002014` shows quantity variance of 1,000 units)
- [ ] **TC-IV-09:** Currency Mismatch Check (PO `4500002019` EUR vs US company code)
- [ ] **TC-IV-10:** Invoice Value Exceeds PO Value (PO `4500002025` invoice price is blocked due to variance)

---

## 🤝 6. Supplier Acknowledgement Testing
- [ ] **TC-AK-01:** Acknowledgement Required and Missing (PO `4500002006` is flagged)
- [ ] **TC-AK-02:** Acknowledgement Required and Received (PO `4500002002` has actual date recorded)
- [ ] **TC-AK-03:** Acknowledgement Not Required (PO `4500002011` has no missing ack exception)
- [ ] **TC-AK-04:** Late Acknowledgement Flagged (PO `4500002007` acknowledged 19 days after creation)
- [ ] **TC-AK-05:** High-Value PO Without Acknowledgement (PO `4500002010` is flagged at Critical severity)
- [ ] **TC-AK-06:** Overdue PO Without Acknowledgement (PO `4500002023` is flagged as Overdue Missing ACK)

---

## ✉️ 7. Reminder and Email Trigger Testing
- [ ] **TC-EM-01:** Reminder Button Visible (PO `4500002009` drawer displays active button)
- [ ] **TC-EM-02:** Reminder Button Hidden for Closed/Deleted POs (PO `4500002015`/`2016` do not show button)
- [ ] **TC-EM-03:** Reminder Disabled if Recently Sent (PO `4500002008` button is inactive due to rate-limit)
- [ ] **TC-EM-04:** Send Reminder for Missing Acknowledgement (Verify status moves to pending supplier response)
- [ ] **TC-EM-05:** Send Reminder for Overdue PO (Verify reminder logged)
- [ ] **TC-EM-06:** Email Preview Screen Modal opens before sending
- [ ] **TC-EM-07:** Email Preview contains correct PO Number (`4500002010` shows `4500002010`)
- [ ] **TC-EM-08:** Email Preview contains correct Supplier Name (`4500002010` shows `Global Foundry`)
- [ ] **TC-EM-09:** Email Preview contains correct delivery date (`2026-07-20`)
- [ ] **TC-EM-10:** Email Preview contains correct open quantity and value (`5000` / `$125,000`)
- [ ] **TC-EM-11:** Email Preview contains correct buyer name (`Sarah Planner`)
- [ ] **TC-EM-12:** Confirming send increments `reminder_count` in database
- [ ] **TC-EM-13:** Confirming send updates `last_reminder_date` in database
- [ ] **TC-EM-14:** PO moves from "Awaiting Action" to "Pending Supplier Response" tab
- [ ] **TC-EM-15:** Communication history log updates with transmission details

---

## 📋 8. Recommendation/Workbench Testing
- [ ] **TC-REC-01:** Awaiting Action Tab displays new recommendation card/row
- [ ] **TC-REC-02:** Pending Supplier Response Tab displays sent reminders
- [ ] **TC-REC-03:** Resolved / Closed Tab displays completed/verified items as read-only (🔒)
- [ ] **TC-REC-04:** Recommended Action Text reflects the business suggestion
- [ ] **TC-REC-05:** Status Transition works when action is taken (moves from recommended to pending response)
- [ ] **TC-REC-06:** Recommendations are not created/shown for Closed/Deleted POs
- [ ] **TC-REC-07:** Critical severity recommendations receive highest priority score

---

## 🔍 9. Drill-Down Testing
- [ ] **TC-DD-01:** Open PO Lines Card Drill-down count matches table rows (76 lines)
- [ ] **TC-DD-02:** Overdue PO Card Drill-down count matches table rows (23 lines)
- [ ] **TC-DD-03:** Pending ACK Card Drill-down count matches table rows (14 lines)
- [ ] **TC-DD-04:** Pending GR Card Drill-down count matches table rows (22 lines)
- [ ] **TC-DD-05:** Invoice Blocked Card Drill-down count matches table rows (8 lines)
- [ ] **TC-DD-06:** High Risk Card Drill-down count matches table rows (18 lines)
- [ ] **TC-DD-07:** Supplier Drill-down matches specific supplier segment
- [ ] **TC-DD-08:** Buyer Drill-down matches specific buyer segment
- [ ] **TC-DD-09:** Plant Drill-down matches specific plant segment

---

## 🎛️ 10. Filter and Search Testing
- [ ] **TC-FIL-01:** Filter by Supplier updates metrics and tables
- [ ] **TC-FIL-02:** Filter by Plant updates metrics and tables
- [ ] **TC-FIL-03:** Filter by Buyer updates metrics and tables
- [ ] **TC-FIL-04:** Filter by Status updates metrics and tables
- [ ] **TC-FIL-05:** Filter by Risk Category updates metrics and tables
- [ ] **TC-FIL-06:** Combined plant and supplier filter is additive
- [ ] **TC-FIL-07:** Clear Filters restores the full counts and datasets
- [ ] **TC-FIL-08:** Search by PO Number works
- [ ] **TC-FIL-09:** Search by Supplier Name works

---

## 🛑 11. Data Quality Testing
- [ ] **TC-DQ-01:** Missing Delivery Date (PO `4500002018` is flagged and handled safely)
- [ ] **TC-DQ-02:** Missing Supplier ID (PO `4500002030` is flagged and handled safely)
- [ ] **TC-DQ-03:** Missing Buyer ID is handled safely
- [ ] **TC-DQ-04:** Missing Plant code is handled safely
- [ ] **TC-DQ-05:** Missing Unit Price is handled safely
- [ ] **TC-DQ-06:** Missing Ordered Quantity is handled safely
- [ ] **TC-DQ-07:** Invalid Date Value is flagged
- [ ] **TC-DQ-08:** Negative Quantity (PO `4500002029` is flagged for review)
- [ ] **TC-DQ-09:** Received Qty > Ordered Qty (PO `4500002028` is flagged)
- [ ] **TC-DQ-10:** Duplicate PO line detection works
- [ ] **TC-DQ-11:** Unknown Status field value is handled safely
- [ ] **TC-DQ-12:** Currency Missing is handled safely
- [ ] **TC-DQ-13:** Currency Mismatch is flagged
- [ ] **TC-DQ-14:** Deleted Line with Open Quantity is excluded from counts (PO `4500002027`)

---

## 🚀 12. End-to-End Scenarios Verified
- [ ] **Scenario A:** Overdue, missing ack, no GR, high-value order workflow.
- [ ] **Scenario B:** Fully received and invoiced order exclusion workflow.
- [ ] **Scenario C:** Deleted order with historical data preservation.
- [ ] **Scenario D:** GR completed but invoice blocked workflow.
- [ ] **Scenario E:** Supplier reminder sent recently (rate-limit block).
