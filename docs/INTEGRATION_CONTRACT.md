# Integration Contract — Aalok Sidekick
## Release 1: Supplier Commitment Core

This document defines the architecture contract for how Aalok Sidekick loads procurement data.
It governs all teams and AI sessions working on this project.

---

## 1. Current Architecture (Phase 5)

```
Frontend (app/page.tsx)
  ↓  fetch('/api/...')                 ← browser fetch, client-side
Next.js API Routes (app/api/)
  ↓  import procurementDataService     ← server-side, migrating gradually
  OR import csvDataService directly    ← legacy, being replaced
Procurement Data Service (procurementDataService.ts)
  ↓  mode === 'mock_erp'
Mock ERP Adapter (mockErpService.ts)
  ↓  direct import (no HTTP loopback)
CSV Data Service (csvDataService.ts)
  ↓
CSV files (procurement_data_sample/)
```

### What changed in Phase 5
- **Added:** `src/types/procurement.ts` — canonical business-language types
- **Added:** `src/config/dataSource.ts` — mode configuration (`'mock_erp'`)
- **Added:** `src/services/mockErpService.ts` — CSV adapter, direct import, reads only
- **Added:** `src/services/procurementDataService.ts` — mode router
- **Migrated:** `/api/po-overdue/summary` now calls `procurementDataService.getOverdueSummaryMetrics()`
- **Unchanged:** All frontend `fetch()` calls, all other API routes, `csvDataService.ts`, CSV files

---

## 2. Target Architecture (Future Phases)

```
Frontend (app/page.tsx)
  ↓  fetch('/api/...')
Next.js API Routes (thin — auth, validation, rate-limit)
  ↓  import procurementDataService
Procurement Data Service
  ↓  mode === 'sap_odata' | 'backend_api'
SAP OData Adapter OR Backend API Adapter
  ↓
SAP S/4HANA OData services OR Azure SQL / Supabase
```

To switch data source: change `DATA_SOURCE_CONFIG.mode` in `src/config/dataSource.ts`.
No frontend code, no API routes, no business logic changes required.

---

## 3. Data Source Modes

| Mode | Status | Description |
|------|--------|-------------|
| `mock_erp` | ✅ **Active (Release 1)** | Direct import of `csvDataService.ts`. Local CSV files only. |
| `csv` | ✅ Alias | Treated identically to `mock_erp`. Reserved for future distinction. |
| `backend_api` | 🔴 Not implemented | Future: calls a deployed backend/middleware REST or GraphQL API. |
| `sap_odata` | 🔴 Not implemented | Future: calls SAP S/4HANA OData V4 endpoints directly from the server. |

---

## 4. Release 1 Service Methods

All methods are **read-only in Phase 5**. Write methods are deferred to Phase 6.

| Service Method | Description | Module |
|---------------|-------------|--------|
| `getExecutiveOverview()` | Combined KPI + chart data for dashboard | Executive Overview |
| `getOverdueSummaryMetrics()` | Tile KPIs for overdue workbench header | Executive Overview, Overdue Workbench |
| `getOverduePurchaseOrderLines(filters)` | Paginated overdue schedule-line list | Overdue PO Workbench |
| `getPurchaseOrderLineDetail(po, item, line)` | Full detail context for drawer | Overdue PO Workbench |
| `getAcknowledgementSummaryMetrics()` | Tile KPIs for acks header | Supplier Acknowledgements |
| `getSupplierAcknowledgements(filters)` | Paginated ack worklist | Supplier Acknowledgements |
| `getSupplierAnalytics(filters)` | Supplier scorecard list | Supplier Analytics |
| `getSupplierDetail(supplierId)` | Detail scorecard for one supplier | Supplier Analytics |
| `getFilterOptions()` | Dropdown values for filter bars | Overdue PO Workbench |

### Planned Phase 6 Write Methods (not yet implemented)
| Method | Description |
|--------|-------------|
| `saveFollowUpAction(params)` | Persist a buyer follow-up or expedite draft |
| `updateAcknowledgementStatus(params)` | Record a supplier ack status change |
| `updatePurchaseOrderLineStatus(params)` | Mark a PO line resolved or in-review |

---

## 5. Core Business Objects

See `src/types/procurement.ts` for the full TypeScript definitions.

| Type | Granularity | Module Usage |
|------|-------------|--------------|
| `PurchaseOrderLine` | PO Schedule Line | Overdue Workbench grid |
| `PurchaseOrderLineDetail` | PO Schedule Line | Overdue Workbench drawer |
| `SupplierAcknowledgement` | PO Item | Supplier Acks grid |
| `Supplier` | Supplier | Supplier Analytics grid |
| `SupplierAnalyticsSummary` | Supplier | Supplier Analytics drawer |
| `ExecutiveOverviewSummary` | Portfolio | Executive Overview |
| `FollowUpAction` | PO Item | Phase 6 write path |

---

## 6. Data Ownership

### ERP-Owned Data (Source of Truth: SAP / ERP system)
These fields must never be modified by the app. The app reads them only.

| Field | CSV Source | ERP Table (future) |
|-------|-----------|-------------------|
| PO Number | `purchase_order_headers.csv` | `EKKO` |
| PO Item | `purchase_order_items.csv` | `EKPO` |
| Schedule Line | `po_schedule_lines.csv` | `EKET` |
| Supplier Master | `suppliers.csv` | `LFA1` |
| Material/Service | `materials.csv`, `purchase_order_items.csv` | `MARA` / `EKPO` |
| Ordered Quantity | `po_schedule_lines.csv` `scheduled_qty` | `EKET-MENGE` |
| Received Quantity / GR | `goods_receipts.csv` `received_qty` | `MSEG`, `MKPF` |
| Requested Delivery Date | `po_schedule_lines.csv` `delivery_date` | `EKET-EINDT` |
| Confirmed Delivery Date | `supplier_acknowledgements.csv` `committed_delivery_date` | Supplier portal / `EKES` |
| Official PO Status | `purchase_order_headers.csv` `header_status` | `EKKO-LOEKZ` / lifecycle |

### App-Owned Data (Managed by Aalok Sidekick)
These fields are created and maintained by the application. They have no ERP equivalent.

| Field | Current Storage | Future Storage |
|-------|----------------|---------------|
| Buyer follow-up notes | In-memory (recommendations cache) | App database (Phase 6) |
| Follow-up actions | In-memory recommendations | App database (Phase 6) |
| Acknowledgement interpretation | `supplier_acknowledgements.csv` | App database (Phase 6) |
| Supplier response classification | Derived logic in `csvDataService.ts` | App service layer |
| Escalation status | Not persisted | App database (Phase 6) |
| Resolution status | Derived: `openQty === 0 → RESOLVED` | App database override (Phase 6) |
| Manual priority override | Not yet implemented | App database (Phase 6) |
| Owner/buyer assignment | `exception_worklist.csv` `assigned_buyer` | App database (Phase 6) |
| Audit trail | Not persisted | App database (Phase 6) |

---

## 7. Field Calculation Rules

See `docs/FIELD_DEFINITIONS.md` for full definitions.

| Field | Formula | Calculated In |
|-------|---------|---------------|
| Open Quantity | `Max(0, scheduled_qty − received_qty)` | `csvDataService.calculateOpenQuantity()` |
| Open Value | `Open Quantity × net_price` | `csvDataService.calculateOpenValue()` |
| Overdue Days | `Max(0, TODAY − requested_delivery_date)` | `csvDataService.calculateOverdueDays()` |
| Priority Score | Logarithmic formula (see FIELD_DEFINITIONS.md §11) | `fetchJoinedWorklist()` |
| Resolution Status | `openQty === 0 → 'RESOLVED'` | `fetchJoinedWorklist()` |

**Rule:** All derived fields are calculated in the backend service layer only.
Frontend components must never perform inline calculations on business fields.

---

## 8. API Route Ownership Map

| API Route | Status | csvDataService Function |
|-----------|--------|------------------------|
| `GET /api/overview/summary` | Legacy (direct import) | `getGlobalOverviewSummary()` |
| `GET /api/overview/details` | Legacy (direct import) | `getDashboardOverviewDetails()` |
| `GET /api/po-overdue/summary` | ✅ **Migrated (Phase 5)** | `procurementDataService.getOverdueSummaryMetrics()` |
| `GET /api/po-overdue/worklist` | Legacy (direct import) | `getOverdueWorklist()` |
| `GET /api/po-overdue/detail` | Legacy (direct import) | `getExceptionDetail()` |
| `GET /api/po-acknowledgement/summary` | Legacy (direct import) | `getAcknowledgementSummary()` |
| `GET /api/po-acknowledgement/worklist` | Legacy (direct import) | `getAcknowledgementWorklist()` |
| `GET /api/supplier-performance/list` | Legacy (direct import) | `getSupplierPerformanceList()` |
| `GET /api/supplier-performance/detail` | Legacy (direct import) | `getSupplierPerformanceDetail()` |
| `GET /api/filters` | Legacy (direct import) | `getFilterOptions()` |

**Phase 6 migration priority:** Migrate the remaining 9 legacy routes to `procurementDataService`.

---

## 9. Security Responsibilities

| Concern | Owner | Implementation Status |
|---------|-------|----------------------|
| Authentication | Backend/API layer | Not implemented (Phase 6+) |
| Authorization | Backend/API layer | Not implemented (Phase 6+) |
| Input validation | API route layer | Partial (type coercion only) |
| Concurrency / locking | App database layer | Not implemented (Phase 6+) |
| Audit trail | App database layer | Not implemented (Phase 6+) |
| SAP credential management | Backend/API layer | Not implemented (Phase 6+) |

> [!CAUTION]
> SAP credentials must never be stored in the frontend or passed through the browser.
> All SAP calls must go through a backend API layer that handles auth tokens securely.
