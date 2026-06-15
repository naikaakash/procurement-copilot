# 🔒 Project Governance: Feature Freeze

This document records the official development freeze decision for the **Aalok Sidekick (Buyer/Planner Action Workbench)**.

---

## 🚦 Feature Freeze Rule

The application is now in **single-user MVP validation mode**.

No new feature development should be performed unless the user explicitly writes the exact phrase:

**I AGREE TO THE RISKS AND WANT TO PROCEED FORWARD**

Until that phrase is provided, the agent must stop and warn the user if they ask for any new feature.

---

## 🟢 Allowed Work During Freeze

The following work is permitted without risk-acceptance confirmation:

*   **Bug fixes:** Resolving UI crashes, console errors, or workflow freezes.
*   **Business logic fixes:** Correcting discrepancies in status rules or routing decisions.
*   **Calculation fixes:** Adjusting math for quantities, spend values, or overdue days.
*   **Test case fixes:** Modifying or correcting testing framework assertions.
*   **Data reconciliation fixes:** Aligning UI counts with local files.
*   **Mock data correction:** Fixing JSON or CSV data formatting or seeding.
*   **UI fixes:** Limited to layout errors blocking verification or causing user misunderstanding.
*   **Documentation updates:** Writing or updating guides, readmes, or checklists.
*   **Manual testing guide updates:** Enhancing testing scenarios.
*   **Checklist updates:** Refining checklist items.
*   **Error handling fixes:** Adding try-catch blocks or showing descriptive errors.
*   **Small cleanup:** Code refactoring strictly required for a failed test.

---

## 🔴 Blocked Work During Freeze

The following work is strictly blocked unless the user explicitly provides the risk-acceptance phrase:

*   New dashboard cards
*   New pages or views
*   New workflows or action pathways
*   New AI/LLM features
*   New Sourcing Copilot features or commands
*   New analytics modules or metrics
*   New charts or graphs
*   New external integrations (API endpoints or webhooks)
*   Real email sending (SMTP/Outlook Graph)
*   Multi-user support
*   Role-based access controls (RBAC)
*   Database migrations (PostgreSQL/Supabase)
*   SAP/ERP integration or write-backs
*   Scalability redesigns
*   Major refactoring of working code
*   Visual redesigns not required for testing
*   Any feature that expands scope beyond the current single-user MVP

---

## 🗣️ Required Agent Behavior

If the user requests a new feature, the agent must respond with:

> “Feature freeze is active. This request appears to be new feature development. Current allowed work is limited to bug fixes, test fixes, reconciliation fixes, and documentation/testing improvements. To proceed with this feature, please explicitly confirm: I AGREE TO THE RISKS AND WANT TO PROCEED FORWARD.”

The agent **must not** implement the feature until that exact phrase is provided.

---

## 🎯 Project Milestones

### Current Milestone: Single-User MVP Validation Mode
*   **Goal:** Complete manual business testing, resolve failed tests, and ensure the app is reliable for one business user using mock/prototype data.

### Next Milestone (After Validation): Multi-User Pilot Readiness Review
Moving to this milestone requires a formal security and capability review, covering:
*   User Login and Authentication
*   Roles and Permissions (RBAC)
*   Shared SQL Database Integration
*   System Audit Trails
*   Multi-user State Handling
*   Reminder/Action Ownership
*   Email Governance
*   System Backup/Recovery
*   Deployment Stability
*   Security Review

---

## ✉️ Email Functionality Rule

Real email sending (SMTP/Outlook Graph Integration) must remain disabled until:
1.  Reminder eligibility tests pass.
2.  Duplicate reminder blocking passes.
3.  Email preview tests pass.
4.  Failed-send handling passes.
5.  Communication history logging passes.
6.  The user explicitly approves enabling real email.
7.  The user provides the phrase: `I AGREE TO THE RISKS AND WANT TO PROCEED FORWARD`.

*Note: Mock email/reminder testing and logging are allowed.*
