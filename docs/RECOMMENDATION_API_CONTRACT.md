# Recommendation API Contract — Procurement Copilot

This document details the route list, payloads, request/response examples, status codes, and constraints for the **Recommendation Lifecycle API** implemented in **Phase 8B**.

---

## 1. Route Summary

All paths are relative to the application API root `/api/recommendations`.

| Method | Endpoint | Description | Request Body | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/recommendations` | List recommendations with optional filter criteria. | *None* | `200` |
| **POST** | `/api/recommendations` | Create a new recommendation. | `RecommendationInput` | `201`, `400` |
| **GET** | `/api/recommendations/[id]` | Retrieve detail for a single recommendation. | *None* | `200`, `404` |
| **PATCH** | `/api/recommendations/[id]` | Update fields on an existing recommendation. | `RecommendationUpdateInput` | `200`, `400`, `404`, `409` |
| **POST** | `/api/recommendations/[id]/transition` | Transition lifecycle status. | `RecommendationStatusTransitionInput` | `200`, `400`, `404`, `409` |
| **POST** | `/api/recommendations/[id]/link-action` | Link a ProcurementAction to history. | `{ actionId: string, expectedVersion: number }` | `200`, `400`, `404`, `409` |
| **GET** | `/api/recommendations/po-line` | Lookup recommendations for a PO schedule line. | *None (Query Params)* | `200`, `400` |
| **GET** | `/api/recommendations/supplier` | Lookup recommendations for a vendor. | *None (Query Param)* | `200`, `400` |

---

## 2. Request and Response Examples

### A. List Recommendations
* **URL:** `GET /api/recommendations?status=PENDING_BUYER_ACTION&supplierId=VEND-001`
* **Response (200 OK):**
```json
{
  "recommendations": [
    {
      "recommendationId": "rec-seed-001",
      "sourceModule": "OVERDUE_PO",
      "purchaseOrderNumber": "4500000437",
      "purchaseOrderItem": "00040",
      "supplierId": "VEND-001",
      "supplierName": "Test Supplier",
      "recommendationType": "SEND_SUPPLIER_REMINDER",
      "lifecycleStatus": "PENDING_BUYER_ACTION",
      "currentOwner": "BUYER",
      "issueDetectedAt": "2026-06-08T10:00:00.000Z",
      "issueReason": "PO line is overdue and supplier has not confirmed recovery date.",
      "recommendedActionText": "Send supplier reminder requesting delivery confirmation.",
      "verificationStatus": "NOT_READY",
      "createdBy": "system.seed",
      "createdAt": "2026-06-08T10:00:00.000Z",
      "updatedBy": "system.seed",
      "updatedAt": "2026-06-08T10:00:00.000Z",
      "version": 1,
      "linkedActionIds": []
    }
  ],
  "total": 1
}
```

### B. Create Recommendation
* **URL:** `POST /api/recommendations`
* **Request Body:**
```json
{
  "sourceModule": "OVERDUE_PO",
  "purchaseOrderNumber": "4500000437",
  "purchaseOrderItem": "00040",
  "supplierId": "VEND-001",
  "supplierName": "Test Supplier",
  "recommendationType": "SEND_SUPPLIER_REMINDER",
  "issueReason": "Line remains overdue.",
  "recommendedActionText": "Send automated reminder."
}
```
* **Response (201 Created):**
```json
{
  "recommendationId": "50e7b75b-4351-4091-8854-be7cf3ea24a2",
  "sourceModule": "OVERDUE_PO",
  "purchaseOrderNumber": "4500000437",
  "purchaseOrderItem": "00040",
  "supplierId": "VEND-001",
  "supplierName": "Test Supplier",
  "recommendationType": "SEND_SUPPLIER_REMINDER",
  "lifecycleStatus": "RECOMMENDED",
  "currentOwner": "BUYER",
  "issueDetectedAt": "2026-06-08T18:28:17.200Z",
  "issueReason": "Line remains overdue.",
  "recommendedActionText": "Send automated reminder.",
  "verificationStatus": "NOT_READY",
  "createdBy": "local-user",
  "createdAt": "2026-06-08T18:28:17.200Z",
  "updatedBy": "local-user",
  "updatedAt": "2026-06-08T18:28:17.200Z",
  "version": 1,
  "linkedActionIds": []
}
```

### C. Update Recommendation (Optimistic Concurrency)
* **URL:** `PATCH /api/recommendations/rec-seed-001`
* **Request Body:**
```json
{
  "expectedVersion": 1,
  "recommendedActionText": "Updated instructions for the buyer."
}
```
* **Response (200 OK):**
```json
{
  "recommendationId": "rec-seed-001",
  "recommendedActionText": "Updated instructions for the buyer.",
  "version": 2,
  "updatedAt": "2026-06-08T18:30:11.450Z",
  "updatedBy": "local-user"
  // ... other fields remain unchanged
}
```

* **Stale Response (409 Conflict):**
If `expectedVersion` is passed as `1` but the current record version on disk has already moved to `2`:
```json
{
  "error": "Optimistic concurrency conflict on recommendation \"rec-seed-001\". Expected version 1, found version 2. Refresh the record and resubmit."
}
```

### D. Transition Lifecycle Status
* **URL:** `POST /api/recommendations/rec-seed-003/transition`
* **Request Body:**
```json
{
  "nextStatus": "VERIFICATION_PENDING",
  "expectedVersion": 1,
  "closureReason": "Buyer verified manual update in SAP",
  "updatedBy": "buyer.test"
}
```
* **Response (200 OK):**
```json
{
  "recommendationId": "rec-seed-003",
  "lifecycleStatus": "VERIFICATION_PENDING",
  "currentOwner": "SOURCE_SYSTEM",
  "verificationStatus": "PENDING_NEXT_SYNC",
  "closureReason": "Buyer verified manual update in SAP",
  "version": 2
  // ... other fields remain
}
```

### E. Link Action to Recommendation
* **URL:** `POST /api/recommendations/rec-seed-001/link-action`
* **Request Body:**
```json
{
  "actionId": "92960f3a-5005-473d-a8c6-a98b13d8424e",
  "expectedVersion": 1
}
```
* **Response (200 OK):**
```json
{
  "recommendationId": "rec-seed-001",
  "linkedActionIds": [
    "92960f3a-5005-473d-a8c6-a98b13d8424e"
  ],
  "version": 2
}
```

---

## 3. Query Param Lookups

### PO Line query
* **URL:** `GET /api/recommendations/po-line?purchaseOrderNumber=4500000437&purchaseOrderItem=00040`
* **Response (200 OK):**
```json
{
  "recommendations": [...],
  "total": 1
}
```

### Supplier query
* **URL:** `GET /api/recommendations/supplier?supplierId=VEND-001`
* **Response (200 OK):**
```json
{
  "recommendations": [...],
  "total": 3
}
```

---

## 4. Error Mapping

* **400 Bad Request:** Returned on schema mismatch, missing required parameter, invalid JSON formatting, or validation failures.
* **404 Not Found:** Returned when the requested `recommendationId` does not exist in the store.
* **409 Conflict:** Returned on optimistic concurrency version collisions.
* **500 Internal Server Error:** Returned on unexpected file read/write issues. Server does not expose technical node stack traces to the caller.

---

## 5. Architectural Boundaries & Guardrails
1. **Recommendations are separate from ProcurementActions:** Linking is supported via ID mappings, but the tables and models are kept strictly distinct.
2. **No direct CSV / SAP mutations:** Recommendations are written locally to `data/app-recommendations.json`. ERP data services (`csvDataService`) are not imported by any file in this API layout.
