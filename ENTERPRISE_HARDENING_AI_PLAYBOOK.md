# Enterprise Hardening AI Playbook
## Buyer-Planner / Procurement Workbench

**Purpose:** This file is designed to live inside the project repository so Gemini, Claude, Cursor, Copilot, or any AI coding assistant can understand the correct execution order even if the human owner forgets the prompts.

**Current mode:** Enterprise hardening freeze.

**Critical rule:** Do not implement new product features until the non-Azure enterprise-hardening phases are complete.

---

# 0. Operating Instructions for Any AI Assistant

You are working on an existing procurement/buyer-planner application. The app currently works locally using CSV files and JSON state files. A prior architecture review rated the app as not enterprise-ready because of data persistence, authentication, authorization, auditability, validation, error handling, monitoring, and architectural fragmentation risks.

Your job is **not** to add product features.

Your job is to make the existing app safe, testable, persistent, authenticated, auditable, and deployable.

## Allowed Work

You may work on:

1. Local PostgreSQL database foundation.
2. Prisma schema and migrations.
3. CSV-to-database import pipeline.
4. Migration away from JSON state files.
5. Authentication.
6. Authorization / RBAC.
7. Audit logging.
8. Request validation.
9. Data quality checks.
10. Error handling.
11. Structured logging.
12. Health/status endpoints.
13. Tests.
14. Service refactoring required to remove god objects.
15. Documentation.
16. Local Docker setup.
17. Azure migration only after non-Azure hardening is complete.

## Disallowed Work Until Hardening Is Complete

Do not build:

1. New dashboards.
2. New Copilot features.
3. New analytics modules.
4. Supplier portal.
5. Mobile app.
6. Slack/email/Zapier integrations.
7. New recommendation types.
8. Major UI redesign.
9. Advanced forecasting.
10. Any new business feature not required for hardening.

## Execution Rule

Work phase by phase. Do not skip ahead. For each phase:

1. Inspect before changing.
2. Make the smallest safe change.
3. Preserve existing API response shapes unless explicitly instructed.
4. Add or update tests.
5. Update documentation.
6. Stop and summarize completion, risks, and next recommended phase.

---

# 1. Overall Roadmap

There are two major tracks.

## Track A — Non-Azure Enterprise Hardening

Complete this first.

1. Phase 0: Freeze and hardening inventory.
2. Phase 1: Local database foundation.
3. Phase 2: CSV and JSON state migration.
4. Phase 3: Authentication and authorization.
5. Phase 4: Audit logging.
6. Phase 5: Validation and data-quality controls.
7. Phase 6: Error handling, logging, health checks.
8. Phase 7: Escalation/rules reliability.
9. Phase 8: Service refactor and architecture cleanup.
10. Phase 9: Test, load, and demo readiness.

## Track B — Azure Movement

Start this only after Track A is complete.

1. Azure Phase A: Azure readiness audit.
2. Azure Phase B: Azure resource planning.
3. Azure Phase C: Azure infrastructure creation.
4. Azure Phase D: Secrets, storage, and environment config.
5. Azure Phase E: Deployment pipeline.
6. Azure Phase F: Data migration to Azure PostgreSQL.
7. Azure Phase G: Monitoring, cost controls, and pilot validation.

---

# TRACK A — NON-AZURE ENTERPRISE HARDENING

---

# Phase 0 — Development Freeze and Inventory

## Goal

Stop new feature development and create a full risk inventory of the current app.

## Exit Criteria

- Repository documents enterprise-hardening freeze.
- All routes, data files, write paths, and risky state paths are inventoried.
- AI assistant knows not to add new features.

---

## Phase 0A Prompt — Create Hardening Branch and Freeze Document

```text
We are entering enterprise-hardening mode.

Do not implement new product features.

Create a new branch called enterprise-hardening-phase-1 if branch creation is available in this environment. If not, document that this should be done manually.

Create docs/development-freeze.md with the following rules:

Allowed work:
- local PostgreSQL database setup
- Prisma schema and migrations
- CSV-to-database import
- migration away from JSON write state
- authentication
- authorization / RBAC
- audit logging
- validation
- data quality checks
- error handling
- structured logging
- health/status endpoints
- tests
- refactoring required to support hardening
- documentation

Not allowed:
- new dashboards
- new copilot features
- new analytics modules
- supplier portal
- mobile app
- new integrations
- major UI redesign
- advanced forecasting
- any new feature unrelated to enterprise hardening

Also add a short section to README.md called "Current Development Mode: Enterprise Hardening Freeze".

Do not change application behavior.
```

---

## Phase 0B Prompt — Full Hardening Inventory

```text
Inspect the app and produce docs/enterprise-hardening-inventory.md.

Do not change application behavior.

Include:

1. All API routes.
2. All CSV read paths.
3. All CSV write paths, if any.
4. All JSON read paths.
5. All JSON write paths.
6. All mutation routes: POST, PUT, PATCH, DELETE.
7. All unauthenticated routes.
8. All business state files.
9. All places where recommendations, escalations, PO updates, supplier updates, part availability, MRP logic, and workflow state are handled.
10. Any god objects or files with too many responsibilities.
11. Any hardcoded business rules.
12. Any missing error handling.
13. Any missing validation.

For every item, include:

- file path
- current responsibility
- reads data: yes/no
- writes data: yes/no
- needs database migration: yes/no
- needs auth: yes/no
- needs RBAC: yes/no
- needs audit log: yes/no
- needs validation: yes/no
- suggested target service:
  - PoService
  - PartService
  - SupplierService
  - EscalationService
  - RecommendationService
  - ImportService
  - AuditService
  - AuthService
  - ValidationService
  - LoggingService
- risk level: critical/high/medium/low
- recommended phase to fix it

Save the report at docs/enterprise-hardening-inventory.md.
```

---

# Phase 1 — Local Database Foundation

## Goal

Add a proper local PostgreSQL foundation without using Azure yet.

## Key Rule

Use local PostgreSQL, preferably through Docker. Do not create Azure resources in this phase.

## Exit Criteria

- Prisma is installed and configured.
- PostgreSQL schema exists.
- Local database can run.
- Initial migration succeeds.
- Existing app behavior is not broken.

---

## Phase 1A Prompt — Add Prisma and Local PostgreSQL

```text
Implement the local PostgreSQL + Prisma foundation.

Important:
- Do not use Azure.
- Do not migrate existing API routes yet.
- Do not add product features.
- Do not remove CSV behavior yet.

Tasks:
1. Install Prisma and @prisma/client if not already installed.
2. Initialize Prisma if not already initialized.
3. Configure PostgreSQL as the datasource.
4. Add DATABASE_URL to .env.example.
5. Add DATABASE_MODE to .env.example with allowed values:
   - csv
   - postgresql
6. Create or update prisma/schema.prisma.
7. Add docs/database-setup.md explaining how to run local PostgreSQL.
8. Add docker-compose.yml for local PostgreSQL if appropriate.

The app should still be able to run in CSV mode after this phase.
```

---

## Phase 1B Prompt — Create Initial Database Schema

```text
Create the initial Prisma schema for enterprise-hardening.

Do not over-engineer. Keep it practical and aligned to the existing app.

Models to create or validate:

1. User
   - id
   - email
   - name
   - role
   - createdAt
   - updatedAt

2. Supplier
   - id
   - supplierCode
   - name
   - status
   - createdAt
   - updatedAt

3. Part
   - id
   - partNumber
   - description
   - unitOfMeasure
   - createdAt
   - updatedAt

4. PurchaseOrder
   - id
   - poNumber
   - supplierId
   - status
   - buyerId optional
   - orderDate
   - dueDate
   - acknowledgedAt optional
   - createdAt
   - updatedAt

5. PurchaseOrderLine
   - id
   - purchaseOrderId
   - partId optional
   - lineNumber
   - quantity
   - unitPrice optional
   - dueDate optional
   - status
   - createdAt
   - updatedAt

6. InventorySnapshot
   - id
   - partId
   - quantityOnHand
   - quantityAllocated
   - snapshotDate
   - createdAt

7. Escalation
   - id
   - purchaseOrderId optional
   - supplierId optional
   - status
   - severity
   - reason
   - assignedToUserId optional
   - createdAt
   - updatedAt
   - closedAt optional
   - version integer default 1

8. Recommendation
   - id
   - entityType
   - entityId
   - recommendationType
   - title
   - body
   - status
   - confidence optional
   - createdAt
   - updatedAt
   - version integer default 1

9. AuditLog
   - id
   - actorUserId optional
   - entityType
   - entityId
   - action
   - beforeJson optional
   - afterJson optional
   - metadataJson optional
   - createdAt

10. ImportBatch
   - id
   - sourceType
   - filename optional
   - status
   - rowsRead
   - rowsInserted
   - rowsUpdated
   - rowsRejected
   - startedAt
   - completedAt optional
   - errorSummary optional

Add indexes for:
- poNumber
- supplierCode
- partNumber
- purchase order status
- purchase order dueDate
- escalation status
- recommendation status
- audit entityType/entityId
- import status

Run a migration and update docs/database-setup.md.
```

---

# Phase 2 — Migrate CSV and JSON State Locally

## Goal

Move business data from CSV/JSON into local PostgreSQL while preserving the existing frontend/API contracts.

## Exit Criteria

- Existing CSV files can be imported into PostgreSQL.
- Production business state is no longer written to JSON files.
- Critical API routes can read from PostgreSQL.
- CSV mode remains temporarily available only as a fallback/import source.

---

## Phase 2A Prompt — CSV Import Pipeline

```text
Create a controlled CSV-to-PostgreSQL import pipeline.

Do not change frontend behavior.

Tasks:
1. Locate current CSV files used by the app.
2. Create scripts/import-csv-to-db.ts.
3. Parse each CSV type currently used by the app.
4. Validate required fields before inserting.
5. Create an ImportBatch record for each import.
6. Upsert suppliers, purchase orders, purchase order lines, parts, inventory snapshots, and any other currently supported entities.
7. Reject invalid rows.
8. Save rejected rows and rejection reasons under rejected-imports/.
9. Print a summary:
   - rows read
   - rows inserted
   - rows updated
   - rows rejected
   - rejection reasons
10. Add docs/csv-import.md with usage instructions.

Do not remove the CSV service yet.
```

---

## Phase 2B Prompt — Data Access Toggle

```text
Add a data access toggle so the app can run in CSV mode or PostgreSQL mode.

Tasks:
1. Add DATABASE_MODE handling.
2. Allowed values:
   - csv
   - postgresql
3. Create a DataService interface that captures current read/write methods used by API routes.
4. Create CsvDataService adapter around existing CSV logic.
5. Create PostgresDataService adapter around Prisma logic.
6. Do not change API response shapes.
7. Add tests proving both modes can be selected.
8. Update docs/data-access-mode.md.

Important:
- This is a transition step.
- The final target is PostgreSQL mode for enterprise readiness.
```

---

## Phase 2C Prompt — Migrate PO Overdue Route

```text
Migrate the PO overdue API route from CSV reads to the new DataService/PostgreSQL path.

Scope:
- Only PO overdue and its immediate helper logic.

Tasks:
1. Identify the current PO overdue API route.
2. Move query logic into PoService.
3. Implement PostgreSQL query path using Prisma.
4. Keep the API response shape exactly the same.
5. Add error handling.
6. Add tests for:
   - no overdue POs
   - one overdue PO
   - multiple overdue POs
   - supplier filter if supported
   - date filter if supported
7. Update docs/data-migration-notes.md.

Acceptance criteria:
- Frontend does not break.
- PO overdue route can run from PostgreSQL.
- No new product features are added.
```

---

## Phase 2D Prompt — Migrate PO Acknowledgement Route

```text
Migrate the PO acknowledgement API route from CSV reads to the new DataService/PostgreSQL path.

Scope:
- Only acknowledgement-related route and helper logic.

Tasks:
1. Identify the current acknowledgement API route.
2. Move acknowledgement query/update logic into PoService or WorkflowService.
3. Implement PostgreSQL query/update path using Prisma.
4. Preserve response shape.
5. Add optimistic concurrency protection using updatedAt or version where updates occur.
6. Add tests for:
   - PO not found
   - PO already acknowledged
   - acknowledgement update
   - concurrent update conflict
7. Add audit placeholder hooks if AuditService is not complete yet.
8. Update docs/data-migration-notes.md.
```

---

## Phase 2E Prompt — Migrate Part Availability / MRP Route

```text
Migrate part availability and MRP API logic from CSV reads to PostgreSQL.

Scope:
- Only part availability / MRP routes and immediate helper logic.

Tasks:
1. Identify current part availability and MRP routes.
2. Move logic into PartService.
3. Implement PostgreSQL query path using Prisma.
4. Preserve API response shapes.
5. Add validation for:
   - missing part
   - invalid date
   - negative quantity
   - missing inventory
6. Add tests for:
   - part found
   - part not found
   - zero inventory
   - negative quantity rejected
   - future demand date handled
7. Update docs/data-migration-notes.md.

Do not change the MRP algorithm unless required to preserve correctness.
```

---

## Phase 2F Prompt — Migrate Supplier Performance Route

```text
Migrate supplier performance API logic from CSV reads to PostgreSQL.

Scope:
- Only supplier performance route and immediate helper logic.

Tasks:
1. Identify supplier performance route.
2. Move logic into SupplierService.
3. Implement PostgreSQL query path using Prisma.
4. Preserve API response shapes.
5. Add tests for:
   - supplier with no POs
   - supplier with late POs
   - supplier with on-time POs
   - supplier with mixed performance
   - unknown supplier
6. Update docs/data-migration-notes.md.

Do not add new supplier analytics.
```

---

## Phase 2G Prompt — Replace JSON Write State

```text
Migrate JSON write-state to PostgreSQL.

Focus on:
- recommendation_updates.json
- escalation_updates.json
- any project_memory JSON files used as mutable business state

Tasks:
1. Identify every code path that reads these JSON files.
2. Identify every code path that writes these JSON files.
3. Replace recommendation writes with Recommendation table writes.
4. Replace escalation writes with Escalation table writes.
5. Preserve API response shapes.
6. Add optimistic concurrency using version or updatedAt.
7. Add tests for simultaneous update attempts.
8. Mark old JSON files as deprecated.
9. Prevent production routes from writing business state to JSON.
10. Update docs/json-state-migration.md.

Acceptance criteria:
- No production route writes business state to JSON.
- Escalations and recommendations survive app restart.
- Concurrent updates do not silently overwrite each other.
```

---

# Phase 3 — Authentication and Authorization

## Goal

Prevent anonymous access and enforce role-based permissions.

## Exit Criteria

- App has login/logout.
- All procurement APIs require authentication.
- Mutation APIs require proper role.
- RBAC matrix is documented and tested.

---

## Phase 3A Prompt — Add Authentication

```text
Add authentication to the app.

Use a solution compatible with the current Next.js structure. Prefer Auth.js / NextAuth if appropriate.

Do not use Azure AD yet. This is non-Azure local hardening.

Tasks:
1. Add authentication provider suitable for local development.
2. Add login/logout flow.
3. Add session handling.
4. Integrate with the Prisma User model.
5. Add seed users:
   - buyer@example.com
   - manager@example.com
   - admin@example.com
6. Protect app pages that show procurement data.
7. Protect all API routes by default.
8. Leave /api/health public if needed.
9. Add docs/authentication.md.

Acceptance criteria:
- Anonymous users cannot access procurement data.
- Local developer can log in as Buyer, Manager, or Admin.
```

---

## Phase 3B Prompt — Add RBAC

```text
Implement role-based access control.

Roles:
- Buyer
- Manager
- Admin

Rules:
- Buyer can view assigned/permitted procurement records and perform buyer workflow actions.
- Manager can view team/global procurement records and approve or close escalations.
- Admin can manage users, imports, rules, and system settings.

Tasks:
1. Add role field support to User if not already present.
2. Create an authorization helper such as requireRole or requirePermission.
3. Create a route permission matrix.
4. Apply authorization checks to every API route.
5. Add tests for:
   - anonymous access rejected
   - Buyer blocked from Admin route
   - Manager allowed for Manager route
   - Admin allowed for all protected admin routes
6. Document permissions in docs/rbac-matrix.md.

Acceptance criteria:
- No procurement API is anonymously accessible.
- Mutation routes require role checks.
- RBAC rules are documented.
```

---

## Phase 3C Prompt — Add User Context to Services

```text
Update domain services to accept user context.

Tasks:
1. Define a UserContext type with:
   - userId
   - email
   - role
   - optional organizationId/companyId if already supported
2. Update service methods to accept UserContext where data access is sensitive.
3. Ensure queries are role-aware:
   - Buyer sees assigned/permitted data.
   - Manager sees broader team/global data.
   - Admin sees all data.
4. Do not implement full multi-tenancy yet unless the app already supports it.
5. Document future row-level security plan in docs/row-level-security-plan.md.

Acceptance criteria:
- Services no longer access sensitive data without user context.
- Future Azure/PostgreSQL RLS implementation is prepared but not required yet.
```

---

# Phase 4 — Audit Logging

## Goal

Create enterprise-style traceability: who changed what, when, and from what value to what value.

## Exit Criteria

- Critical mutations create append-only audit logs.
- Audit logs are queryable by Manager/Admin.
- Audit log tests exist.

---

## Phase 4A Prompt — Create AuditService

```text
Implement audit logging for critical business state changes.

Tasks:
1. Use the AuditLog Prisma model.
2. Create AuditService with a logChange method.
3. AuditLog fields should capture:
   - actorUserId
   - entityType
   - entityId
   - action
   - beforeJson
   - afterJson
   - metadataJson
   - createdAt
4. Audit records must be append-only.
5. Do not expose audit editing or deletion.
6. Add unit tests for AuditService.
7. Add docs/audit-logging.md.

Acceptance criteria:
- AuditService can record changes reliably.
- Audit records are immutable from application code.
```

---

## Phase 4B Prompt — Add Audit Logs to Critical Mutations

```text
Add audit logging to all critical mutation paths.

Include:
1. PO status change.
2. PO acknowledgement.
3. Escalation creation.
4. Escalation update.
5. Escalation closure.
6. Recommendation accepted.
7. Recommendation rejected.
8. Supplier data update.
9. CSV import.
10. User role change.

Tasks:
1. Capture before and after state where practical.
2. Include actorUserId.
3. Include request metadata if available.
4. Add tests proving audit records are created.

Acceptance criteria:
- Every critical mutation creates an audit record.
- Existing API response shapes are preserved unless explicitly documented.
```

---

## Phase 4C Prompt — Read-Only Audit API

```text
Create a read-only audit log API.

Tasks:
1. Add audit search route.
2. Restrict to Manager and Admin roles.
3. Add filters:
   - entityType
   - entityId
   - actorUserId
   - action
   - date range
4. Add pagination.
5. Add tests for filtering and authorization.
6. Update docs/audit-logging.md.

Do not build a complex UI in this phase.
```

---

# Phase 5 — Validation and Data Quality

## Goal

Prevent bad or malformed data from entering the system.

## Exit Criteria

- Mutation routes validate inputs.
- CSV imports reject bad rows.
- Validation errors are consistent and test-covered.

---

## Phase 5A Prompt — Add Zod Validation to Mutation Routes

```text
Add request validation to all mutation routes using Zod or the existing validation library if one already exists.

Tasks:
1. Identify all POST, PUT, PATCH, DELETE routes.
2. Create validation schemas for request bodies.
3. Validate route params and query params where needed.
4. Return consistent 400 responses for validation failures.
5. Do not leak stack traces.
6. Add tests for invalid payloads.
7. Document validation conventions in docs/api-validation.md.

Acceptance criteria:
- Bad requests are rejected before business logic runs.
- Existing successful responses remain compatible.
```

---

## Phase 5B Prompt — Add CSV Import Quarantine

```text
Improve CSV import data-quality checks.

Tasks:
1. Validate each CSV row before database insert/update.
2. Reject rows with:
   - missing PO number
   - missing supplier
   - invalid dates
   - negative quantities
   - invalid PO status
   - malformed part number
   - impossible due dates if business rules define them
3. Store rejected rows with rejection reason.
4. Add import summary report.
5. Add tests with valid and invalid sample CSV rows.
6. Update docs/csv-import.md.

Acceptance criteria:
- Bad CSV rows do not enter PostgreSQL.
- Import outcomes are transparent and reviewable.
```

---

# Phase 6 — Error Handling, Logging, and Health Checks

## Goal

Make failures visible, controlled, and diagnosable.

## Exit Criteria

- API routes have consistent error responses.
- Structured logs exist.
- Health/status endpoints exist.
- Critical errors are testable and diagnosable.

---

## Phase 6A Prompt — Standard API Error Wrapper

```text
Create a standard API error-handling wrapper.

Tasks:
1. Add a reusable withApiHandler or equivalent.
2. Catch unexpected errors.
3. Return consistent JSON error responses.
4. Do not leak stack traces to clients.
5. Log errors with:
   - requestId
   - route
   - method
   - userId if available
   - durationMs if available
6. Apply wrapper to the most critical routes first:
   - PO overdue
   - acknowledgement
   - part availability
   - supplier performance
   - recommendations
   - copilot chat if present
   - escalations
   - workflow
   - imports
   - filters
7. Add tests for expected and unexpected failures.
8. Document in docs/error-handling.md.

Acceptance criteria:
- API failures are consistent.
- Errors are logged.
- Clients do not receive raw stack traces.
```

---

## Phase 6B Prompt — Structured Logging

```text
Add structured logging.

Tasks:
1. Add a logging library such as Pino or Winston, unless the app already has one.
2. Log important events:
   - request started
   - request completed
   - request failed
   - auth failure
   - authorization failure
   - validation failure
   - import completed
   - escalation triggered
   - recommendation accepted/rejected
3. Include:
   - requestId
   - userId if available
   - route
   - method
   - durationMs
4. Do not log secrets.
5. Do not dump full sensitive procurement payloads into logs.
6. Document logging conventions in docs/logging.md.

Acceptance criteria:
- Logs are structured JSON or a consistent structured format.
- Errors can be diagnosed from logs.
- Sensitive data is protected.
```

---

## Phase 6C Prompt — Health and Status Endpoints

```text
Add production-style health/status endpoints for local hardening.

Tasks:
1. Create /api/health.
2. Create /api/status.
3. /api/health should verify:
   - app process is running
   - database connection works
4. /api/status should include:
   - app version if available
   - environment
   - database mode
   - database status
   - last successful import timestamp if available
5. Do not expose secrets.
6. /api/health may be public.
7. /api/status should be Admin-only unless there is a reason otherwise.
8. Add tests.

Acceptance criteria:
- Local monitoring can detect app/database health.
- Status endpoint is safe and does not expose secrets.
```

---

# Phase 7 — Escalation and Rules Reliability

## Goal

Move escalation logic away from hardcoded or JSON-only behavior into versioned, auditable, testable rules.

## Exit Criteria

- Escalation logic is explicit.
- Rules are stored in database or documented transitional config.
- Rule changes are auditable.
- Dry-run testing exists if practical.

---

## Phase 7A Prompt — Inventory Escalation Logic

```text
Inspect escalation and autonomous monitoring logic.

Do not change behavior yet.

Produce docs/escalation-rules-inventory.md with:
1. All files involved in escalation logic.
2. All hardcoded thresholds.
3. All JSON files used for escalation state.
4. All scheduled/monitoring behavior.
5. All API routes involved.
6. What triggers an escalation.
7. What closes an escalation.
8. What updates escalation severity.
9. Missing audit points.
10. Missing tests.

For each rule, identify:
- current location
- business meaning
- data dependencies
- risk if wrong
- whether it should become configurable
```

---

## Phase 7B Prompt — Create Escalation Rule Model

```text
Create a database-backed escalation rule foundation.

Tasks:
1. Add an EscalationRule model if not already present.
2. Include:
   - id
   - name
   - description
   - conditionJson
   - actionJson
   - severity
   - isActive
   - version
   - createdByUserId optional
   - createdAt
   - updatedAt
3. Add migration.
4. Seed initial rules equivalent to current hardcoded behavior.
5. Do not change user-facing behavior.
6. Document in docs/escalation-rules.md.

Acceptance criteria:
- Current escalation behavior can be represented as versioned rules.
- Rules can later be managed without code deploys.
```

---

## Phase 7C Prompt — Add Rule Evaluation Service

```text
Create an EscalationRuleService.

Tasks:
1. Load active rules from database.
2. Evaluate rules against PO/supplier/part data.
3. Produce deterministic results.
4. Add dry-run mode that reports what would trigger without writing changes.
5. Log rule evaluation failures.
6. Add tests for current rule behavior.
7. Preserve existing escalation API response shapes.

Acceptance criteria:
- Escalation behavior is testable.
- Dry-run mode can be used before enabling rule changes.
- Existing behavior is preserved.
```

---

# Phase 8 — Service Refactor and Architecture Cleanup

## Goal

Reduce god objects and architectural fragmentation after the data/auth/audit foundation is stable.

## Exit Criteria

- csvDataService is no longer the central god object.
- Domain services have clear responsibilities.
- Circular dependencies are reduced.
- Documentation explains module boundaries.

---

## Phase 8A Prompt — Define Target Domain Boundaries

```text
Define the target backend architecture.

Create docs/domain-architecture.md.

Recommended services:
1. PoService
2. PartService
3. SupplierService
4. EscalationService
5. EscalationRuleService
6. RecommendationService
7. ImportService
8. AuditService
9. AuthService
10. ValidationService
11. LoggingService
12. CacheService if caching exists or is needed

For each service, document:
- responsibility
- allowed dependencies
- disallowed dependencies
- API routes that should use it
- data models owned or touched
- tests required

Do not change code in this step.
```

---

## Phase 8B Prompt — Split csvDataService Incrementally

```text
Refactor csvDataService incrementally into domain services.

Rules:
- Do not change API response shapes.
- Do not add product features.
- Move one domain at a time.
- Add tests around moved logic.
- Leave compatibility wrappers if necessary.

Order:
1. PoService
2. PartService
3. SupplierService
4. EscalationService
5. RecommendationService
6. ImportService

For this step, start with PoService only.

Tasks:
1. Move PO-related logic out of csvDataService.
2. Ensure all PO routes use PoService.
3. Add or update tests.
4. Update docs/domain-architecture.md.
5. Summarize what remains in csvDataService.

Stop after PoService.
```

---

## Phase 8C Prompt — Continue Service Split

```text
Continue the service split from csvDataService.

This time, migrate the next domain only:
[REPLACE_WITH_DOMAIN: PartService / SupplierService / EscalationService / RecommendationService / ImportService]

Rules:
- Do not change API response shapes.
- Do not add product features.
- Add tests.
- Update docs/domain-architecture.md.
- Summarize remaining csvDataService responsibilities.
```

---

# Phase 9 — Tests, Load, and Demo Readiness

## Goal

Prove the app is safe enough for internal testing/pilot before Azure movement.

## Exit Criteria

- Critical tests pass.
- Auth/RBAC tests pass.
- Import tests pass.
- Mutation + audit tests pass.
- Basic load smoke test passes.
- Known risks are documented.

---

## Phase 9A Prompt — Critical Test Coverage

```text
Add or improve tests for enterprise-hardening critical paths.

Focus on:
1. Authentication required for protected APIs.
2. RBAC rejects unauthorized roles.
3. PO overdue query works from PostgreSQL.
4. PO acknowledgement mutation creates audit log.
5. Escalation mutation creates audit log.
6. Recommendation mutation creates audit log.
7. CSV import rejects bad rows.
8. Validation rejects bad mutation payloads.
9. API errors return consistent responses.
10. Health endpoint detects database failure.

Do not chase 100% coverage.
Focus on enterprise-risk coverage.

Update docs/test-plan.md.
```

---

## Phase 9B Prompt — Local Load Smoke Test

```text
Create a basic local load smoke test.

Tasks:
1. Add a script or documented command to hit critical read APIs repeatedly.
2. Include:
   - PO overdue
   - part availability
   - supplier performance
   - health
3. If authenticated APIs require login, document how to run the test with a dev token/session.
4. Target a small internal-readiness baseline:
   - 100 concurrent requests total or equivalent lightweight local smoke test
   - no crashes
   - errors are logged
5. Document results in docs/load-smoke-test.md.

Do not optimize prematurely unless a clear bottleneck is found.
```

---

## Phase 9C Prompt — Non-Azure Hardening Exit Review

```text
Perform a non-Azure enterprise-hardening exit review.

Create docs/non-azure-hardening-exit-review.md.

Review:
1. Is business state persisted in PostgreSQL?
2. Are JSON files no longer used for production write-state?
3. Are procurement APIs authenticated?
4. Is RBAC enforced?
5. Are critical mutations audited?
6. Are mutation inputs validated?
7. Are CSV imports validated and rejected rows quarantined?
8. Are API errors consistently handled?
9. Are logs structured?
10. Do health/status endpoints exist?
11. Are critical tests passing?
12. Are known risks documented?
13. Is the app ready for Azure migration prep?

Use ratings:
- complete
- mostly complete
- partial
- not started

End with:
- Go / No-Go for Azure movement
- top 5 remaining risks
- recommended next phase
```

---

# TRACK B — AZURE MOVEMENT

Start this only after `docs/non-azure-hardening-exit-review.md` says **Go for Azure movement**.

This track follows the Azure movement package provided separately, which includes:
- START_HERE.md
- QUICK_START.md
- AZURE_MIGRATION_GUIDE.md
- AZURE_MIGRATION_CHECKLIST.md
- AZURE_COST_CALCULATOR.md
- MIGRATION_SUMMARY.txt

Important adjustment:
The attached Azure package assumes CSV-to-Azure migration. In this project, the preferred path is:

**CSV/local JSON → local PostgreSQL hardening → Azure PostgreSQL deployment**

Do not jump directly from fragile CSV/JSON to Azure.

---

# Azure Phase A — Azure Readiness Audit

## Goal

Confirm local hardening is ready for cloud deployment.

## Azure Phase A Prompt

```text
Perform an Azure readiness audit.

Do not create Azure resources yet.

Use the local hardening work and the Azure migration documents as references.

Create docs/azure-readiness-audit.md.

Check:
1. App runs locally in PostgreSQL mode.
2. No production business state writes to JSON files.
3. Prisma migrations are clean.
4. DATABASE_URL is environment-based.
5. Required environment variables are documented in .env.example.
6. Secrets are not committed.
7. Auth works locally.
8. RBAC works locally.
9. Audit logs work locally.
10. Health endpoint exists.
11. Status endpoint exists and is safe.
12. CSV import pipeline works locally.
13. Docker/local setup works if implemented.
14. Build succeeds with production command.
15. Test suite passes.

End with:
- Azure Go / No-Go
- blockers
- exact next actions
```

---

# Azure Phase B — Resource and Cost Plan

## Goal

Choose Azure architecture and budget before creating resources.

## Azure Phase B Prompt

```text
Create docs/azure-resource-plan.md.

Use the attached Azure migration package as the baseline.

Plan for a cost-conscious pilot first.

Include:
1. Azure region recommendation.
2. App hosting choice:
   - Azure App Service or Azure Container Apps
3. Database:
   - Azure Database for PostgreSQL Flexible Server
4. Storage:
   - Azure Blob Storage for imports/exports
5. Secrets:
   - App Service environment variables initially
   - Azure Key Vault when appropriate
6. Monitoring:
   - Application Insights
   - basic alerts
7. Authentication future:
   - Microsoft Entra ID / Azure AD provider
8. Cost scenario:
   - minimal/pilot
   - cost-optimized production
   - production
9. Required environment variables.
10. Rollback plan.
11. Backup/restore plan.

Do not create resources yet.
```

---

# Azure Phase C — Infrastructure Creation

## Goal

Create Azure infrastructure only after readiness and resource plans are approved.

## Azure Phase C Prompt

```text
Prepare Azure infrastructure scripts.

Do not hardcode secrets.

Create scripts/azure/create-infrastructure.sh or equivalent documentation.

Resources to create:
1. Resource group.
2. Azure Database for PostgreSQL Flexible Server.
3. PostgreSQL database.
4. Storage account.
5. Blob container for imports/exports.
6. App Service Plan.
7. Web App / App Service.
8. Application Insights.
9. Optional Key Vault.

Tasks:
1. Use environment variables for names, passwords, and region.
2. Add comments explaining each command.
3. Add docs/azure-infrastructure.md.
4. Include teardown commands for dev/test resources.
5. Include cost warning.

Do not run the commands unless explicitly instructed by the human owner.
```

---

# Azure Phase D — Secrets and Environment Configuration

## Goal

Make the app safe to run in Azure without committed secrets.

## Azure Phase D Prompt

```text
Prepare Azure environment configuration.

Tasks:
1. List all required environment variables.
2. Create docs/azure-environment-variables.md.
3. Add startup validation for required production environment variables.
4. Ensure DATABASE_URL uses Azure PostgreSQL SSL mode when deployed.
5. Ensure NEXTAUTH_URL or auth equivalent is configurable.
6. Ensure auth secrets are not committed.
7. Ensure logging level is environment-based.
8. Ensure local .env files remain gitignored.
9. Document App Service configuration steps.
10. Document Key Vault option if used.

Acceptance criteria:
- Production app fails fast if required env vars are missing.
- No secret is stored in source code.
```

---

# Azure Phase E — Deployment Pipeline

## Goal

Deploy safely through a repeatable process.

## Azure Phase E Prompt

```text
Create an Azure deployment pipeline.

Preferred:
- GitHub Actions deploying to Azure App Service.

Tasks:
1. Add .github/workflows/azure-deploy.yml.
2. Run install, lint, tests, build.
3. Generate Prisma client.
4. Handle Prisma migrations safely.
5. Deploy only after tests pass.
6. Use GitHub secrets for Azure credentials.
7. Add docs/azure-deployment.md.
8. Add rollback instructions.

Important:
- Do not expose secrets in logs.
- Do not auto-run destructive migrations without documentation.
```

---

# Azure Phase F — Data Migration to Azure PostgreSQL

## Goal

Move already-hardened local PostgreSQL data to Azure PostgreSQL.

## Azure Phase F Prompt

```text
Create the Azure data migration plan.

Important:
The app should already be working locally in PostgreSQL mode.

Tasks:
1. Create docs/azure-data-migration.md.
2. Document migration options:
   - rerun CSV import directly against Azure PostgreSQL
   - dump local PostgreSQL and restore to Azure PostgreSQL
3. Add safest recommended path for pilot.
4. Include validation checks:
   - row counts
   - supplier counts
   - PO counts
   - escalation counts
   - recommendation counts
   - audit log counts
5. Include rollback plan.
6. Include backup before migration.
7. Include post-migration smoke test.
8. Do not migrate data automatically unless explicitly instructed.
```

---

# Azure Phase G — Monitoring, Cost Controls, and Pilot Validation

## Goal

Ensure the deployed app is observable and budget-controlled.

## Azure Phase G Prompt

```text
Prepare Azure pilot monitoring and cost controls.

Tasks:
1. Create docs/azure-pilot-runbook.md.
2. Configure or document Application Insights checks:
   - request failures
   - response times
   - dependency failures
   - database errors
3. Configure or document alerts:
   - app down
   - high error rate
   - database unavailable
   - high CPU/memory
4. Add cost-control checklist:
   - budget alert
   - resource tagging
   - stop/delete unused dev resources
   - review App Service SKU
   - review PostgreSQL SKU
5. Add pilot validation:
   - 5 to 10 users
   - 8-hour session
   - no critical crashes
   - health endpoint stable
   - audit logs created
   - no anonymous access
6. Add Go/No-Go checklist for wider rollout.
```

---

# Master Prompt to Start From Any Point

Use this when returning to the project after a break.

```text
Read ENTERPRISE_HARDENING_AI_PLAYBOOK.md first.

We are in enterprise-hardening mode.

Do not add new product features.

Determine the current phase by checking:
1. docs/development-freeze.md
2. docs/enterprise-hardening-inventory.md
3. docs/database-setup.md
4. docs/data-migration-notes.md
5. docs/json-state-migration.md
6. docs/authentication.md
7. docs/rbac-matrix.md
8. docs/audit-logging.md
9. docs/api-validation.md
10. docs/error-handling.md
11. docs/logging.md
12. docs/non-azure-hardening-exit-review.md
13. docs/azure-readiness-audit.md, if present

Then report:
1. Current completed phases.
2. Current incomplete phase.
3. Blockers.
4. Recommended next subphase.
5. Files that need to be touched.
6. Tests that should be run.

Do not change code until you have reported the current phase and next action.
```

---

# Emergency Reset Prompt

Use this if the AI assistant starts adding random features or loses context.

```text
Stop.

You are violating the enterprise-hardening freeze.

Do not add new product features.

Return to ENTERPRISE_HARDENING_AI_PLAYBOOK.md.

Your task is only to:
1. identify the current hardening phase,
2. identify the next incomplete subphase,
3. continue enterprise-readiness fixes,
4. preserve existing API response shapes,
5. update tests and documentation.

Revert or isolate any unrelated product feature changes before continuing.
```

---

# Definition of Done for Non-Azure Hardening

The app is not ready for Azure movement until all of the following are true:

1. Existing business state persists in PostgreSQL.
2. CSV is no longer the runtime source of truth.
3. JSON files are not used for production write-state.
4. Procurement APIs require authentication.
5. RBAC is enforced.
6. Critical mutations create audit logs.
7. Mutation payloads are validated.
8. CSV imports have validation and rejection handling.
9. API errors are consistently handled.
10. Logs are structured.
11. Health/status endpoints exist.
12. Core tests pass.
13. Basic local load smoke test passes.
14. Non-Azure exit review says Go for Azure movement.

---

# Definition of Done for Azure Movement

The app is not ready for pilot users until:

1. Azure readiness audit says Go.
2. Azure resource plan is documented.
3. Infrastructure is created from documented scripts/commands.
4. Secrets are stored outside source code.
5. App deploys through repeatable pipeline.
6. Prisma migrations run safely.
7. Data migration is verified.
8. Health endpoint is green.
9. Authentication works in deployed environment.
10. RBAC works in deployed environment.
11. Audit logs are created in deployed environment.
12. Monitoring is active.
13. Budget alert is configured.
14. Pilot runbook exists.
15. Rollback plan exists.
