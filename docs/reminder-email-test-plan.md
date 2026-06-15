# ✉️ Supplier Reminder & Email Trigger Test Plan

This document establishes the test plan for verifying the **Send Reminder** workflow. It details when the option must appear, how to trigger the email, expected content, duplicate transmission blocks, and how verification is performed against the system's databases.

---

## 🛠️ Test Case Directory

### TC-EM-01: Reminder Option Visibility for Eligible POs
*   **Trigger Condition:** 
    *   PO is active open (`deletion_completion_indicator` == `ACTIVE_OPEN`).
    *   Recommendation status is `AWAITING_ACTION` or `RECOMMENDED`.
    *   PO has a valid overdue state OR has a missing acknowledgement.
*   **Steps to Trigger:**
    1. Reset the demo state: `node scripts/reset-demo-state.js`.
    2. Open the application and navigate to the **Overdue Workbench** page.
    3. Select PO `4500002009` (overdue, missing ack).
*   **Expected Email / Reminder Output:** No immediate email output, but the "Send Supplier Reminder" button should be active and visible in the PO detail drawer.
*   **Expected System Status Update:** System remains in `RECOMMENDED` state awaiting click.
*   **How to Verify:** Visually confirm the button appears in the sidebar drawer.

---

### TC-EM-02: Trigger for Missing Acknowledgement
*   **Trigger Condition:** PO has `acknowledgement_required` == `Y` AND `acknowledgement_date` == `null` (e.g. PO `4500002006`).
*   **Steps to Trigger:**
    1. Select PO `4500002006` from the list.
    2. Open the detail drawer and click the primary action button: **"Request Acknowledgement"** or **"Send Reminder"**.
*   **Expected Email / Reminder Output:** A modal opens showing a draft email with:
    *   *To:* supplier contact email
    *   *Subject:* Urgently Await Acknowledgement for PO 4500002006
    *   *Body:* Standard template requesting confirmation.
*   **Expected System Status Update:** Upon clicking "Confirm Send", recommendation status transitions from `RECOMMENDED` to `PENDING_SUPPLIER_RESPONSE`.
*   **How to Verify:**
    1. Check that the row is removed from the "Awaiting Action" tab and resides in "Pending Supplier Response".
    2. Open `data/app-supplier-reminders.json` and verify a record is added with `po_number: "4500002006"`, `timestamp`, and `status: "SENT"`.

---

### TC-EM-03: Trigger for Overdue PO
*   **Trigger Condition:** PO line is overdue with open quantity (e.g. PO `4500002024`).
*   **Steps to Trigger:**
    1. Search for PO `4500002024` in the Overdue Workbench.
    2. Click the PO row, then click **"Send Supplier Reminder"** in the drawer.
*   **Expected Email / Reminder Output:** Email draft populated with:
    *   *PO Number:* 4500002024
    *   *Overdue Quantity:* 100 pcs
    *   *Statistical Delivery Date:* June 1, 2026
*   **Expected System Status Update:** Recommendation moves to `PENDING_SUPPLIER_RESPONSE`.
*   **How to Verify:**
    1. Verify that the communication history inside the PO detail drawer reflects the sent reminder.
    2. Verify `reminder_count` increments in the database records.

---

### TC-EM-04: Button Hidden for Closed/Deleted POs
*   **Trigger Condition:** PO is closed or deleted (`deletion_completion_indicator` IN (`DELETED`, `COMPLETED`)).
*   **Steps to Trigger:**
    1. Search for PO `4500002015` (deleted) or `4500002016` (completed).
    2. Open the PO detail drawer.
*   **Expected Email / Reminder Output:** No email output.
*   **Expected System Status Update:** The **"Send Reminder"** button must be completely hidden. A warning or status badge showing `Closed` or `Deleted` is displayed instead.
*   **How to Verify:** Confirm the drawer has no active buttons and states *"🔒 Closed history is read-only"*.

---

### TC-EM-05: Prevention of Double Reminders (Rate Limiting)
*   **Trigger Condition:** A reminder was sent within the last 72 hours (`last_reminder_date` is close to current date).
*   **Steps to Trigger:**
    1. Open PO `4500002008` (which has a seeded `last_reminder_date` of `2026-06-04`).
    2. Inspect the action buttons in the detail drawer.
*   **Expected Email / Reminder Output:** No email output.
*   **Expected System Status Update:** The "Send Reminder" button is disabled or replaced with a warning banner: *"A reminder was recently sent on 2026-06-04. Please wait before contacting the supplier again."*
*   **How to Verify:** Confirm the button is unclickable and the rate limit banner is visible.

---

### TC-EM-06: Email Content Template Validation
*   **Trigger Condition:** Sending a reminder for PO `4500002010`.
*   **Steps to Trigger:**
    1. Select PO `4500002010`.
    2. Click **"Send Reminder"**.
*   **Expected Email / Reminder Output:** Reconcile all variables in the generated text:
    *   **PO Number:** `4500002010`
    *   **Supplier:** `Global Foundry`
    *   **Due Date:** `2026-07-20`
    *   **Open Quantity:** `5000 pcs`
    *   **Buyer Name:** `Sarah Planner`
*   **Expected System Status Update:** Log entry captures the precise variables.
*   **How to Verify:** Read the draft email text in the modal to ensure no raw tokens (e.g. `{po_number}`) remain unreplaced.

---

### TC-EM-07: Error Handling for Failed Email Transmissions
*   **Trigger Condition:** System is set to connect to an external SMTP/Outlook API, but credentials fail (e.g. invalid network state).
*   **Steps to Trigger:**
    1. Set environment variables to enable Outlook sending, but put incorrect password credentials in `.env.local`.
    2. Attempt to click **"Send Reminder"**.
*   **Expected Email / Reminder Output:** A clear error pop-up (Toast) is displayed: *"Failed to send email. Outlook connection refused. Logging mock backup locally."*
*   **Expected System Status Update:** Recommendation remains in `RECOMMENDED` state (does not transition to pending supplier response to prevent false logs).
*   **How to Verify:** Confirm the toast alert displays and the recommendation status is unchanged.
