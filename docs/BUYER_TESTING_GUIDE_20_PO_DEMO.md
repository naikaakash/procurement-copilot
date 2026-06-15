# 📘 Buyer & Planner Testing Guide (20-PO Demo Dataset)

Welcome to the **Buyer/Planner Action Workbench**! This guide is designed to walk you step by step through the application's features using the **20 curated demo Purchase Orders (POs)**. It is written from a buyer's perspective to help you learn, test, and demonstrate the workbench.

> [!IMPORTANT]
> **This is a local read-only mock system.** 
> * **No real emails** are sent to suppliers.
> * **No write-back to SAP** happens automatically. All updates made here are simulated and kept local to this web application.

---

## 🚀 Getting Started & Resetting the Demo

If you want to start from a clean slate or reset the demo to its initial state, run the following command in your terminal:

```powershell
node scripts/reset-demo-state.js
```

This restores the 20 curated POs (`4500001001` through `4500001020`) and clears any buyer notes, actions, or status changes you made during your testing session.

---

## 💡 What the App Does vs. What it Does Not Do

### What the App Does:
1. **Detects Supply Discrepancies:** Highlights overdue items, missing confirmations, and date/quantity changes.
2. **Recommends Next Actions:** Proposes whether to send reminders, update ERP values, or escalate.
3. **Tracks Communication Lifecycle:** Simulates sending emails to suppliers, logging auto-replies (e.g. Out of Office), and parsing their responses.
4. **Verifies ERP Sync:** Inspects subsequent simulated source data refreshes to verify that the updates you made manually in SAP are reflected.
5. **Maintains Audit Logs:** Records buyer actions, comments, and decisions to prevent work duplication.

### What the App Does NOT Do:
1. **No Direct SAP Writes:** When you complete a manual action, you must record it here by clicking *"Confirm manual SAP action completed"*. The app does not modify SAP POs.
2. **No Real Emails:** Supplier emails are mocked. Reminder history shows simulated emails.
3. **No Automatic Syncing:** The app reads static mock CSV files. In a real environment, SAP changes are verified during the scheduled nightly extraction sync.

---

## 🖥️ Major Pages Overview

### 1. Dashboard / Overview
* **What to look at:** High-level metrics like open order values, supplier risk indicators, critical overdue lines count, and recent activity.
* **What to click:** The navigation items in the sidebar. Click **"Overview"** to see aggregated stats.
* **What you should learn:** A bird's-eye view of your procurement exceptions, allowing you to prioritize the most critical supplier issues.

### 2. Overdue PO Page
* **What to look at:** The table of overdue PO lines with priority scores, statistical delivery dates, and overdue days count.
* **Demo PO to use:** `4500001002` (Overdue PO - Critical).
* **What to click:** Click on PO row `4500001002` to open the detail drawer.
* **What should happen:** The detail drawer slides out showing the "Current Situation" (overdue by 8 days) and the "Recommended Next Step" (Send supplier reminder).
* **What you should learn:** How to manage overdue lines and easily click to start the reminder email drafting workflow.

### 3. PO Acknowledgement Page
* **What to look at:** A list of PO lines awaiting supplier confirmation, including missing acknowledgements and price/quantity disputes.
* **Demo PO to use:** `4500001004` (Missing Acknowledgement).
* **What to click:** Click on PO row `4500001004` to view detail drawer.
* **What should happen:** The drawer opens, showing that the supplier has not yet acknowledged this PO line.
* **What you should learn:** How to identify which orders are at risk of non-delivery before they actually go overdue.

### 4. Recommendation Worklist
* **What to look at:** A list of all AI-generated recommendations categorized by their lifecycle status tabs:
  * **Awaiting Action** (Active recommendations needing buyer attention)
  * **Pending Response** (Sent to supplier, waiting for reply)
  * **Responded** (Supplier responded with date/qty changes)
  * **Pending SAP Update** (Buyer agreed and needs to update SAP manually)
  * **Verification Pending** (Update confirmed, awaiting nightly ERP sync)
  * **Resolved / Closed** (Completed, verified, or manually closed items)
  * **Escalated / Blocked** (Exceptions requiring management or support intervention)
* **What to click:** Switch between the tabs at the top of the workbench. Expand the **"Lifecycle Status Guide"** to read status explanations.
* **What you should learn:** How recommendations flow systematically through their lifecycle from detection to resolution.

---

## 🧭 Guided Walkthrough: 20 Demo Scenarios

Run `node scripts/reset-demo-state.js` before starting this walkthrough to ensure a pristine database.

### 1. Clean / Normal PO (`4500001001`)
* **Page:** Overdue Workbench / Search
* **Steps:** Search for PO `4500001001`.
* **What happens:** It does not show up in the exception/overdue list because it is fully acknowledged and delivery is on track.
* **Concept:** The app filters out non-exception items so buyers can focus solely on issues.

### 2. Overdue PO — Send Reminder (`4500001002`)
* **Page:** Overdue PO Page
* **Steps:** 
  1. Click on PO `4500001002`.
  2. Click **"Review Recommendation"** to view it in the Recommendation Worklist.
  3. Under *"Recommended Next Step"*, review the draft email reminder.
  4. Click **"Send Supplier Reminder"**.
* **What happens:** The recommendation status transitions from `RECOMMENDED` to `PENDING_SUPPLIER_RESPONSE`. The drawer refreshes, and the action buttons disappear (owner is now the supplier).
* **Concept:** Demonstrates how simple it is to initiate communication directly from an exception warning.

### 3. Overdue >30 Days — Urgent Escalation (`4500001003`)
* **Page:** Overdue PO Page
* **Steps:** 
  1. Select PO `4500001003` (overdue by 38 days).
  2. Open the drawer to inspect the urgency warning and red severity badge.
* **What happens:** Shows a "CRITICAL" severity warning. The recommended action is to send an urgent notification and escalate to the materials manager.
* **Concept:** Critical aging exceptions automatically receive higher priority scores.

### 4. Missing Acknowledgement (`4500001004`)
* **Page:** PO Acknowledgement Page
* **Steps:** 
  1. Click on PO `4500001004`.
  2. View the drawer. The recommended action is to request acknowledgement.
* **What happens:** Shows the "Missing Acknowledgement" state with "HIGH" severity.
* **Concept:** Acknowledgment tracking prevents overdue issues before they happen.

### 5. Pending Supplier Response (`4500001005`)
* **Page:** Recommendation Worklist (Tab: *Awaiting Supplier Response*)
* **Steps:** 
  1. Open the *Awaiting Supplier Response* tab.
  2. Select PO `4500001005`.
* **What happens:** The drawer opens in a read-only state regarding supplier actions. The communication log displays the sent reminder timestamp.
* **Concept:** Keeps track of orders that have already been queried so buyers don't duplicate emails.

### 6. Responded: Delivery Date Change (`4500001006`)
* **Page:** Recommendation Worklist (Tab: *Supplier Response Interpreted*)
* **Steps:**
  1. Select PO `4500001006`.
  2. Inspect the *"Evidence & History"* section. Note that the supplier response has been captured: `"Rescheduling delivery date to June 12."`
  3. Click **"Accept Supplier Proposal"** (or click *"Confirm manual SAP action completed"* if you already updated it).
* **What happens:** Status moves to `PENDING_BUYER_SAP_UPDATE` (Recommended Manual SAP Update).
* **Concept:** Demonstrates how supplier replies are automatically captured, interpreted, and presented to the buyer for approval.

### 7. Responded: Quantity Change (`4500001007`)
* **Page:** Recommendation Worklist (Tab: *Supplier Response Interpreted*)
* **Steps:**
  1. Select PO `4500001007`.
  2. Notice the parsed supplier response: `"Can confirm only 60 units due to component constraints."`
  3. Under *"Recommended Next Step"*, see the suggestion to update the quantity to `60` in SAP.
* **What happens:** The app presents the quantity change recommendation.
* **Concept:** Highlights parsing of quantity discrepancies.

### 8. Supplier Price Issue (`4500001008`)
* **Page:** Recommendation Worklist (Tab: *Buyer Action Required*)
* **Steps:**
  1. Select PO `4500001008`.
  2. Review the *"Current Situation"*: Supplier acknowledged the PO but disputed the price.
* **What happens:** The status is `PENDING_BUYER_ACTION` (Buyer Action Required).
* **Concept:** Flagging price discrepancies prevents billing mismatches.

### 9. Supplier Rejected (`4500001009`)
* **Page:** Recommendation Worklist (Tab: *Escalated / Blocked*)
* **Steps:**
  1. Select PO `4500001009`.
  2. Inspect the interpreted summary: `"We cannot meet the overdue quantity and must reject the request."`
* **What happens:** The recommendation status is `ESCALATED`. The buyer is prompted to call the supplier or find alternative sources.
* **Concept:** Complete rejections are immediately categorized as escalated.

### 10. Partial Confirmation (`4500001010`)
* **Page:** Recommendation Worklist (Tab: *Buyer Action Required*)
* **Steps:**
  1. Select PO `4500001010`.
  2. Inspect the dispute details: Partial qty confirmation (50/100 units).
* **What happens:** Recommends manual adjustment of schedule lines inside SAP to split the order.
* **Concept:** Guides buyers on how to split schedules when suppliers offer partial shipments.

### 11. Wrong Contact (`4500001011`)
* **Page:** Recommendation Worklist (Tab: *Escalated / Blocked*)
* **Steps:**
  1. Select PO `4500001011`.
  2. Inspect the exception detail. Note the blocked status reason: *"Blocked: Invalid contact email address."*
* **What happens:** Status is `BLOCKED`. Buyer is prompted to update the vendor master email in SAP.
* **Concept:** Communication failures bounce back and block the automation, flagging it for master data cleanup.

### 12. Out of Office (`4500001012`)
* **Page:** Recommendation Worklist (Tab: *Buyer Action Required*)
* **Steps:**
  1. Select PO `4500001012`.
  2. Observe that the parsed supplier email auto-reply marked it as `OUT_OF_OFFICE`.
* **What happens:** The buyer is instructed to contact an alternate contact or wait until the contact returns.
* **Concept:** Out of office emails are intercepted and categorized so buyers don't keep sending automated prompts.

### 13. Unclear Free-Text Response (`4500001013`)
* **Page:** Recommendation Worklist (Tab: *Buyer Action Required*)
* **Steps:**
  1. Select PO `4500001013`.
  2. Read the raw response: `"We will check our schedule and get back to you next week."`
* **What happens:** The heuristic parser flags this as `UNCLEAR`. It requires the buyer to review the text and follow up manually.
* **Concept:** If the automation cannot parse a clean commitment date/quantity, it gracefully falls back to the human buyer.

### 14. Pending Buyer Manual SAP Update (`4500001014`)
* **Page:** Recommendation Worklist (Tab: *Recommended Manual SAP Update*)
* **Steps:**
  1. Select PO `4500001014`.
  2. Under *"Recommended Next Step"*, click the primary button: **"Confirm manual SAP action completed"**.
* **What happens:** The status transitions to `VERIFICATION_PENDING` (Awaiting Source Refresh), and the owner changes from `BUYER` to `SYSTEM` (Awaiting scheduled sync).
* **Concept:** The buyer confirms they have made the edit in SAP, pushing the item into the queue for sync verification.

### 15. Verification Pending (`4500001015`)
* **Page:** Recommendation Worklist (Tab: *Awaiting Source Refresh*)
* **Steps:**
  1. Select PO `4500001015`.
  2. Under *"Evidence & History"*, inspect the Verification Status: `PENDING_NEXT_SYNC`.
* **What happens:** Shows that the buyer updated the date, but the app's nightly ERP source refresh hasn't run yet.
* **Concept:** Holds items in verification until they can be cross-referenced with a fresh ERP snapshot.

### 16. Verification Passed (`4500001016`)
* **Page:** Recommendation Worklist (Tab: *Resolved / Closed*)
* **Steps:**
  1. Select PO `4500001016`.
  2. Check the *"Evidence & History"* section.
* **What happens:** Verification Status is `PASSED`. The target value matches the simulated fresh ERP data snapshot. The drawer shows a secure lock: `🔒 Closed history is read-only.`
* **Concept:** When the new ERP data matches the buyer's update, the app auto-closes the recommendation.

### 17. Verification Failed (`4500001017`)
* **Page:** Recommendation Worklist (Tab: *Awaiting Source Refresh*)
* **Steps:**
  1. Select PO `4500001017`.
  2. Observe the verification warning: `Verification failed. Expected value '2026-06-15' but found '2026-05-20' on the PO.`
  3. Click **"Verify Now"** (simulating manual verification refresh).
* **What happens:** Since the source CSV still has the old date, it remains `FAILED`.
* **Concept:** Alerting the buyer when their manual SAP action failed to sync or was entered incorrectly.

### 18. Blocked (`4500001018`)
* **Page:** Recommendation Worklist (Tab: *Escalated / Blocked*)
* **Steps:** Select PO `4500001018`.
* **What happens:** The item shows as `BLOCKED` with a closure reason: *"Blocked: Contact person not responding after 3 attempts."*
* **Concept:** Tracks issues that cannot progress due to external blocks.

### 19. Escalated (`4500001019`)
* **Page:** Recommendation Worklist (Tab: *Escalated / Blocked*)
* **Steps:** Select PO `4500001019`.
* **What happens:** Shows status `ESCALATED`. Recommends team/manager alignment.
* **Concept:** Segregates high-impact exceptions for special review.

### 20. Closed No Action (`4500001020`)
* **Page:** Recommendation Worklist (Tab: *Resolved / Closed*)
* **Steps:** Select PO `4500001020`.
* **What happens:** Shows status `CLOSED_NO_ACTION` with reason: *"Closed: Material no longer required. PO will be deleted in SAP."* The drawer is locked and read-only.
* **Concept:** Demonstrates manual closure when no system action is required.

---

## 🗣️ What to Say During a Demo (Presenter Talking Points)

Use these notes to explain the app during a live demo or presentation:

* **On the Dashboard:**
  > *"This is our consolidated cockpit. Instead of searching through multiple SAP lists, the buyer is presented with parsed, real-time exceptions. Notice the risk indicators showing where we have supply vulnerabilities."*
* **On the PO detail drawer:**
  > *"When we click a PO, we see a complete 360-degree context. We see the current situation, the recommended action, and the communication history. We don't have to check our Outlook inbox or SAP logs separately; it is all gathered in one view."*
* **On manual SAP updates:**
  > *"This app acts as a co-pilot, not an automated executor. The buyer reviews the proposal, does the update inside SAP, and confirms it here. The system then automatically verifies the sync on the next ERP extraction."*
* **On automatic verification:**
  > *"We avoid manual close-out checks. Once the buyer completes their work, the verification engine checks the next ERP snapshot. If it matches, the exception auto-closes. If it fails, the buyer is alerted."*

---

## 📝 Bug Capture Log Template

If you encounter any unexpected behavior, please record the details below:

| PO Number | Page Name | What I Clicked | What I Expected | What Actually Happened | Console Error / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *Example: 4500001002* | *Overdue PO Page* | *Row click* | *Drawer to open* | *Page crashed with white screen* | *Error: Cannot read property 'map' of undefined* |
| | | | | | |
| | | | | | |

---

## 🎯 Final Acceptance Checklist

Please review this checklist after testing to ensure you are comfortable with the app features:

* [ ] **I understand the Dashboard numbers** and how exceptions affect supplier risk metrics.
* [ ] **I understand the PO Drawer sections** (Situation, Recommendation, History).
* [ ] **I understand the Buyer Action History** and how to trace previous manual inputs.
* [ ] **I understand the Supplier Communication History** log of reminders and responses.
* [ ] **I understand the Recommendation Lifecycle** states and owner switches.
* [ ] **I understand the Manual SAP Action Confirmation** step and how it moves a PO to Verification Pending.
* [ ] **I understand Verification after Sync** (how the app cross-checks CSV data).
* [ ] **I understand what the app does not do yet** (no direct write-back to SAP, no real emails sent).
