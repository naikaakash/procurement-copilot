# manual Buyer Testing Script — Phase 7C: Internal Follow-up Actions

This script is designed for procurement buyers to manually test the internal follow-up actions and notes feature in **Aalok Sidekick**.

---

## 1. Test Purpose

Verify that buyers can log internal notes, record contacted suppliers, and escalate/resolve follow-up tasks on overdue purchase order lines without modifying official SAP records.

## 2. Preconditions

1. You are logged into the Aalok Sidekick workbench.
2. You have navigated to the **Overdue POs** tab (the overdue workbench).

---

## 3. Step-by-Step Test Cases

### Test Case 1: Logging an Internal Note (Happy Path)
1. **Action:** Click on any overdue purchase order row in the grid. This opens the detail drawer on the right.
2. **Action:** Click the **Action Workbench** tab in the drawer.
3. **Action:** Type `"Supplier confirms shipment is delayed but will leave warehouse tomorrow via air freight."` in the note box.
4. **Action:** Click the button **📝 Save Internal Note**.
5. **Expected Result:**
   * A toast notification banner appears stating: `"✅ Internal note saved."`
   * The text box is cleared.
   * A new action card is added immediately to the **Internal Buyer Action History** timeline showing:
     * Badge `NOTE`
     * Status `OPEN`
     * Your text note
     * Version `v1`
     * Time stamp and username (`buyer.test`).

---

### Test Case 2: Recording Supplier Contact
1. **Action:** In the note box, type `"Emailed John from Supplier Sales requesting tracking number."`
2. **Action:** Click the button **📞 Mark Supplier Contacted**.
3. **Expected Result:**
   * A toast notification banner appears stating: `"📞 Supplier contact recorded."`
   * The text box is cleared.
   * A new action card is added to the history showing:
     * Badge `SUPPLIER_CONTACTED`
     * Status `OPEN`
     * Your text note
     * Version `v1`.
4. **Action:** Close the detail drawer by clicking the `✕` in the top right corner.
5. **Action:** Re-click the same PO line to open the drawer again, and click the **Action Workbench** tab.
6. **Expected Result:** Both your logged note and contacted event persist in the chronological list.

---

### Test Case 3: Validation Check (Blank Input)
1. **Action:** Leave the note text area completely empty.
2. **Action:** Click **📝 Save Internal Note**.
3. **Expected Result:**
   * An inline error header box appears stating: `⚠️ Action Error` with the message `"Note is required."`
   * No blank note card is created.
4. **Action:** Close the warning by clicking the `✕` on the warning header.

---

### Test Case 4: Resolving/Completing an Action
1. **Action:** Locate an active action card in the timeline.
2. **Action:** Click the button **Mark Internal Action Complete** on that card.
3. **Expected Result:**
   * A toast notification banner appears stating: `"✅ Internal action completed."`
   * The card's status badge updates from `OPEN` to `COMPLETED`.
   * The version count increments to `v2`.
   * The completion and escalation buttons on that card disappear.

---

### Test Case 5: Escalating an Action
1. **Action:** Locate an active action card in the timeline.
2. **Action:** Click the button **Escalate Internally** on that card.
3. **Expected Result:**
   * A toast notification banner appears stating: `"🚨 Internal escalation recorded."`
   * An orange `ESCALATED` badge appears on the card.
   * The card's status updates to `IN_PROGRESS`.
   * The version count increments.

---

## 4. Evidence to Capture
For testing reports, please capture:
* A screenshot of the **Action Workbench** tab showing the input box and at least two logged items in the **Internal Buyer Action History** timeline.
* A screenshot of the toast banner when you successfully save a note.
* A screenshot of the error box when you try to save a blank note.

---

## 5. Limitations & Out of Scope (For Release 1)

* **No SAP updates:** None of these actions modify quantities, dates, prices, or statuses in SAP. Official PO lines remain unchanged.
* **No email dispatch:** The "Mark Supplier Contacted" button only logs the event in the workbench database. It does not send actual emails to the supplier.
* **Vercel/Cloud Deployments:** This release uses local file storage. Note records will reset on server restarts if deployed to serverless environments (e.g. Vercel).
