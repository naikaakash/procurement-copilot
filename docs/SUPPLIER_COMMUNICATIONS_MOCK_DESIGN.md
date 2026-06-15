# Supplier Communications Mock Design

**Phase**: 8C — Supplier Reminder & Response Mock Capture & 8D — Response Interpretation Rules
**Status**: Implemented  
**Scope**: Backend-only. No UI. No real email. No SAP write-back.

---

## Overview

This document describes the mock backend foundation for supplier reminders and responses. These records are **app-owned workflow data** that complement the recommendation lifecycle defined in Phase 8A/8B.

All data is persisted locally in JSON files. No external services (SMTP, IMAP, Outlook, SAP) are contacted.

---

## Architectural Boundaries

| Layer | File | Responsibility |
|---|---|---|
| Types | `src/types/supplierCommunications.ts` | Data contracts for reminders and responses |
| Store | `src/services/mockSupplierCommunicationStore.ts` | File-backed CRUD + concurrency |
| Interpreter | `src/services/supplierResponseInterpreter.ts` | Rule-based local text classification & entity extraction |
| Service | `src/services/supplierCommunicationService.ts` | Business rules + recommendation lifecycle transitions & auto-interpretation |
| API | `app/api/supplier-communications/...` | HTTP endpoints |
| Data | `data/app-supplier-reminders.json` | Reminder records |
| Data | `data/app-supplier-responses.json` | Response records |

---

## Lifecycle Transitions Triggered by This Layer

| Event | Effect on Recommendation |
|---|---|
| `POST /reminders` (create a reminder) | Recommendation transitions to `PENDING_SUPPLIER_RESPONSE`, owner → `SUPPLIER` |
| `POST /responses` (capture a response) | Recommendation auto-interprets text and transitions to a new state (e.g. `PENDING_BUYER_SAP_UPDATE`, `VERIFICATION_PENDING`, `ESCALATED`) based on category mapping. Owner → `BUYER` (or `SOURCE_SYSTEM` if verification). |
| `POST /responses/[id]/interpret` | Response annotated with structured category — transitions recommendation to the corresponding state and logs proposed SAP fields. |
| `POST /responses/[id]/action` | Response marked `ACTIONED` — no recommendation status change |
| `POST /responses/[id]/dismiss` | Response marked `DISMISSED` — no recommendation status change |

---

## Response Interpretation Lifecycle Mapping (Phase 8D)

When a supplier response is interpreted (either automatically upon capture or manually), the linked Recommendation is transitioned to one of the following statuses with details populated:

- **`DELIVERY_DATE_CHANGED`**:
  - `lifecycleStatus = PENDING_BUYER_SAP_UPDATE`
  - `currentOwner = BUYER`
  - `recommendedSapField = 'deliveryDate'`
  - `expectedValueAfterSync = [proposedNewDeliveryDate]`
  - `verificationStatus = 'PENDING_NEXT_SYNC'`
  - `recommendedActionText = "Manually update SAP delivery date to [date], then wait for next sync verification."`

- **`QUANTITY_CHANGED`**:
  - `lifecycleStatus = PENDING_BUYER_SAP_UPDATE`
  - `currentOwner = BUYER`
  - `recommendedSapField = 'quantity'`
  - `expectedValueAfterSync = [proposedNewQuantity]`
  - `verificationStatus = 'PENDING_NEXT_SYNC'`
  - `recommendedActionText = "Review and manually update SAP quantity if appropriate, then wait for next sync verification."`

- **`ACCEPTED_AS_IS`**:
  - `lifecycleStatus = VERIFICATION_PENDING`
  - `currentOwner = SOURCE_SYSTEM`
  - `verificationStatus = 'PENDING_NEXT_SYNC'`
  - `verificationField = 'acknowledgement_status'` (if request ack recommendation)
  - `expectedValueAfterSync = 'ACKNOWLEDGED'` (if request ack recommendation)
  - `recommendedActionText = "No SAP update is performed by the app. Verify acknowledgement/status after next sync."`

- **`PRICE_ISSUE`**:
  - `lifecycleStatus = PENDING_BUYER_ACTION`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Review supplier price issue with buyer/commercial owner. No automatic SAP update."`

- **`REJECTED`**:
  - `lifecycleStatus = ESCALATED`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier rejected the PO. Escalate and resolve manually. No automatic SAP update."`

- **`PARTIAL_CONFIRMATION`**:
  - `lifecycleStatus = PENDING_BUYER_ACTION`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier partially confirmed the PO. Buyer must review before any manual SAP update."`

- **`NEEDS_CLARIFICATION`**:
  - `lifecycleStatus = PENDING_BUYER_ACTION`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier response needs clarification. Follow up before making any SAP change."`

- **`WRONG_CONTACT`**:
  - `lifecycleStatus = BLOCKED`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier indicates wrong contact. Identify correct contact and resend reminder."`

- **`OUT_OF_OFFICE`**:
  - `lifecycleStatus = PENDING_BUYER_ACTION`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier contact is out of office. Follow up with alternate contact or wait until return."`

- **`FREE_TEXT_UNCLEAR`**:
  - `lifecycleStatus = SUPPLIER_RESPONDED`
  - `currentOwner = BUYER`
  - `recommendedActionText = "Supplier response needs buyer review."`

---

## Data Files

### `data/app-supplier-reminders.json`

Stores `SupplierReminder[]` records. Initialized as empty array on first run.

**Key fields**:
- `reminderId` — UUID
- `recommendationId` — links to a recommendation lifecycle record
- `reminderStatus` — `SENT | CANCELLED`
- `channel` — `EMAIL | PHONE | EDI | PORTAL | MANUAL | OTHER`
- `sentAt` — set on creation (mock = immediate)
- `version` — optimistic concurrency

### `data/app-supplier-responses.json`

Stores `SupplierResponse[]` records. Initialized as empty array on first run.

**Key fields**:
- `responseId` — UUID
- `recommendationId` — links to a recommendation lifecycle record
- `reminderId` — optional, links to the reminder that triggered the response
- `responseStatus` — `CAPTURED → INTERPRETED → ACTIONED | DISMISSED`
- `responseCategory` — structured interpretation category
- `rawResponseText` — unprocessed supplier message
- `proposedNewDeliveryDate / Qty / Price` — optional structured proposal fields
- `version` — optimistic concurrency

---

## API Endpoints

### Reminders

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/supplier-communications/reminders` | List reminders (filterable) |
| `POST` | `/api/supplier-communications/reminders` | Create + send a reminder |
| `GET` | `/api/supplier-communications/reminders/[reminderId]` | Get reminder by ID |
| `PATCH` | `/api/supplier-communications/reminders/[reminderId]` | Update reminder fields |
| `DELETE` | `/api/supplier-communications/reminders/[reminderId]` | Cancel a reminder |

### Responses

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/supplier-communications/responses` | List responses (filterable) |
| `POST` | `/api/supplier-communications/responses` | Capture + auto-interpret a supplier response |
| `GET` | `/api/supplier-communications/responses/[responseId]` | Get response by ID |
| `POST` | `/api/supplier-communications/responses/[responseId]/interpret` | Add/override structured interpretation |
| `POST` | `/api/supplier-communications/responses/[responseId]/action` | Mark as actioned |
| `POST` | `/api/supplier-communications/responses/[responseId]/dismiss` | Dismiss response |
| `POST` | `/api/supplier-communications/responses/interpret-text` | Dry-run local response interpretation |

---

## Query Filters

### Reminders
- `status` — `SENT | CANCELLED`
- `supplierId`
- `purchaseOrderNumber`
- `recommendationId`
- `offset`, `limit`

### Responses
- `status` — `CAPTURED | INTERPRETED | ACTIONED | DISMISSED`
- `supplierId`
- `purchaseOrderNumber`
- `recommendationId`
- `reminderId`
- `offset`, `limit`

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Successful GET or state-change operation |
| `201` | Successful creation |
| `400` | Missing required field or invalid JSON |
| `404` | Reminder or response not found |
| `409` | Optimistic concurrency conflict or invalid state transition |
| `500` | Internal server error |

---

## Concurrency Model

All writable records carry a `version` field (integer, starting at 1). Every write operation requires `expectedVersion` in the request body. If `stored.version !== expectedVersion`, a `409 Conflict` is returned.

The client must re-fetch the record, apply changes, and resubmit with the updated version.

---

## Out of Scope (Phase 8D)

- Real email sending (SMTP, IMAP)
- Outlook / Gmail / Teams integration
- EDI messaging
- SAP write-back or ERP mutations
- Database integration (Azure SQL, Supabase, Cosmos DB)
- Frontend UI for reminders/responses
- External AI/LLM service integrations (e.g. OpenAI API, Gemini API)

These are deferred to later phases.

