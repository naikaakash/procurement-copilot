# ✉️ Phase 9A: Supplier Reminder Email Send Foundation

This document details the implementation of the **Supplier Reminder Email Send Foundation with Outlook-Ready Architecture**. It provides a buyer-facing "Send Reminder" email composer within the workbench detail drawer.

---

## ⚙️ Configuration & Architecture

The email subsystem is isolated behind a provider-agnostic service boundary. The active email provider is determined via environment variables.

### Provider Modes (defined in `src/config/email.ts`):
1. **`mock` (Default):**
   * Default fallback if `EMAIL_PROVIDER` is unset or set to `mock`.
   * Logs reminder records locally in `data/app-supplier-reminders.json`.
   * Transitions the recommendation status and history logs.
   * **Never** attempts to connect to any external mail APIs.
2. **`outlook_graph` (Future Outlook Mode):**
   * Configured via Microsoft Graph.
   * Checks for AZURE credentials and UPN.
   * If config is incomplete (missing IDs or secrets), it returns `NOT_CONFIGURED` and does **not** send or transition status.

### 🌐 Outlook Configuration Variables (`.env.example`):
* `EMAIL_PROVIDER=outlook_graph` (Enables Outlook mode)
* `AZURE_TENANT_ID` (Azure Active Directory Tenant ID)
* `AZURE_CLIENT_ID` (App Registration Client ID)
* `AZURE_CLIENT_SECRET` (Client Credentials Secret)
* `OUTLOOK_SENDER_EMAIL` (Sender Outlook Mailbox / User Principal Name)

---

## 🔄 Lifecycle Impact

When a buyer opens a recommendation needing supplier contact and clicks **"Send Reminder"**:
1. The app displays an interactive draft email composer (pre-filled with recipient email, cc, subject, and body).
2. Upon clicking **"Confirm Send"**:
   * The API endpoint `/api/supplier-communications/reminders/send` is called.
   * In `mock` mode, the service validates email formats and creates a local reminder record.
   * If successful (`MOCK_SENT`), the store persists the log and transitions the recommendation to `PENDING_SUPPLIER_RESPONSE` (current owner becomes `SUPPLIER`).
   * The detail drawer refreshes to reflect the new state, loading the logged email into the *"Evidence & History"* chronological timeline.

---

## 🔒 Safety Boundaries & Guardrails

* **No SAP/ERP Writes:** Sending a reminder modifies local app databases only (`app-supplier-reminders.json` and `app-recommendations.json`). It **never** writes back to SAP tables or changes source CSV files.
* **No Secret Commits:** No client secrets, tenant IDs, or credentials are hard-coded or committed to git.
* **No SMTP/External Outbox Callbacks:** In mock mode, the system operates entirely in-memory and on-disk locally.
* **Incomplete Config Guard:** If `outlook_graph` is selected but env configuration is incomplete, the system fails safely, reports `NOT_CONFIGURED`, and does not alter recommendation statuses.

---

## 🧪 How to Test & Verify

### 1. Mock Send Verification
1. Run `node scripts/reset-demo-state.js` to reset the database.
2. Run the dev server and navigate to the **Recommendation Worklist**.
3. Select PO `4500001002` (Overdue PO in `RECOMMENDED` status).
4. In the side drawer under *"Recommended Next Step"*, click **"Send Reminder"**.
5. Verify that:
   * Draft inputs appear pre-filled (To: `alice@sterlingelectronics.com`).
   * CC, Subject, and Body are editable.
6. Click **"Confirm Send"**.
7. Confirm that:
   * A success alert appears: `"Mock send complete: reminder logged. No Outlook email was sent."`
   * The status changes to `Awaiting Supplier Response` (current owner: `Awaiting Supplier Response`).
   * The timeline in *"Evidence & History"* updates to show the logged reminder.
   * The composer closes.

### 2. Missing Supplier Email Guard
1. Select a PO.
2. In the draft email form, clear the **"To (Supplier Email)"** field.
3. Try to click **"Confirm Send"** (the button should be disabled).
4. If bypassed programmatically, the API will return a validation error: `"Cannot send reminder because supplier email is missing."`

### 3. Closed/Resolved PO Guard
1. Open the *Resolved / Closed* tab.
2. Select a resolved recommendation (e.g. PO `4500001016`).
3. Verify that the **"Send Reminder"** button does not appear, and the read-only notice is displayed.

---

## 🛠️ Outlook Graph Stub Details
In this phase, `outlookGraphEmailProvider.ts` is implemented as a safe boundary stub. It returns `NOT_CONFIGURED` if config is incomplete. If config is complete, it logs simulated sending in local console output and returns a mock success status (`SENT`), acting as a clean template for future production integration.
