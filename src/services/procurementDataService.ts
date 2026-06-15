/**
 * Procurement Data Service — Release 1: Supplier Commitment Core
 *
 * This is the single entry point for all procurement data reads across the
 * four enabled Release 1 modules. It is a mode router that selects the
 * correct adapter based on DATA_SOURCE_CONFIG.mode.
 *
 * Architecture position:
 *   Frontend (page.tsx)          ← does NOT import this yet; uses API routes
 *     ↓ fetch('/api/...')
 *   Next.js API Routes           ← gradually migrate to import this directly
 *     ↓ import procurementDataService
 *   procurementDataService       ← THIS FILE — mode router
 *     ↓ mode === 'mock_erp'
 *   mockErpService               ← csvDataService calls (direct import, no HTTP)
 *     ↓
 *   csvDataService + CSV files   ← unchanged
 *
 * Usage rules (from PROJECT_CONTEXT.md — Service Layer Rule):
 *   - Frontend should call procurementDataService for Release 1 data.
 *   - This service hides whether data comes from CSV, mock ERP, backend API, or SAP.
 *   - CSV/Excel is an adapter, not the app architecture.
 *   - SAP must never be called directly from the frontend.
 *   - The backend/API layer owns auth, validation, concurrency, and audit.
 *
 * Current mode: 'mock_erp' (local CSV via csvDataService)
 * Future modes: 'backend_api', 'sap_odata' — implement new adapter files,
 *               then switch DATA_SOURCE_CONFIG.mode. No other files change.
 *
 * READ-ONLY in Phase 5. Write/action methods added in Phase 6.
 *
 * See: docs/INTEGRATION_CONTRACT.md
 */

import { DATA_SOURCE_CONFIG, type DataSourceMode } from '@/src/config/dataSource';
import * as mockErp from '@/src/services/mockErpService';

import type {
  ExecutiveOverviewSummary,
  PurchaseOrderLine,
  PurchaseOrderLineDetail,
  SupplierAcknowledgement,
  Supplier,
  SupplierAnalyticsSummary,
  PaginatedResponse,
  ProcurementFilterOptions,
  OverdueWorklistFilters,
  AcknowledgementFilters,
  SupplierAnalyticsFilters,
} from '@/src/types/procurement';

// ---------------------------------------------------------------------------
// Internal helper — throws a clear, actionable error for unimplemented modes
// ---------------------------------------------------------------------------

function notImplemented(method: string, mode: DataSourceMode): never {
  throw new Error(
    `[procurementDataService] "${method}" is not implemented for data source mode "${mode}". ` +
    `Implement a new adapter in src/services/ and wire it in this file.`
  );
}

// ---------------------------------------------------------------------------
// Public service interface
// Each method delegates to the appropriate adapter based on current mode.
// ---------------------------------------------------------------------------

/**
 * Returns the combined Executive Overview KPI + chart payload.
 * Used by: Executive Overview module.
 */
export async function getExecutiveOverview(): Promise<ExecutiveOverviewSummary> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getExecutiveOverview();
  return notImplemented('getExecutiveOverview', mode);
}

/**
 * Returns overdue summary KPIs (tile metrics for Overdue Workbench header).
 * Used by: Executive Overview + Overdue PO Workbench.
 */
export async function getOverdueSummaryMetrics() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getOverdueSummaryMetrics();
  return notImplemented('getOverdueSummaryMetrics', mode);
}

/**
 * Returns a paginated, filtered list of overdue PO schedule lines.
 * Used by: Overdue PO Workbench grid.
 */
export async function getOverduePurchaseOrderLines(
  filters: OverdueWorklistFilters
): Promise<PaginatedResponse<PurchaseOrderLine>> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getOverduePurchaseOrderLines(filters);
  return notImplemented('getOverduePurchaseOrderLines', mode);
}

/**
 * Returns the full detail context for a single PO schedule line.
 * Used by: Overdue PO Workbench — detail drawer.
 */
export async function getPurchaseOrderLineDetail(
  poNumber: string,
  itemNumber: string,
  scheduleLine: string
): Promise<PurchaseOrderLineDetail | null> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv')
    return mockErp.getPurchaseOrderLineDetail(poNumber, itemNumber, scheduleLine);
  return notImplemented('getPurchaseOrderLineDetail', mode);
}

/**
 * Returns the acknowledgement summary KPIs.
 * Used by: Supplier Acknowledgements module header.
 */
export async function getAcknowledgementSummaryMetrics() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getAcknowledgementSummaryMetrics();
  return notImplemented('getAcknowledgementSummaryMetrics', mode);
}

/**
 * Returns a paginated, filtered list of supplier acknowledgement items.
 * Used by: Supplier Acknowledgements module grid.
 */
export async function getSupplierAcknowledgements(
  filters: AcknowledgementFilters
): Promise<PaginatedResponse<SupplierAcknowledgement>> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierAcknowledgements(filters);
  return notImplemented('getSupplierAcknowledgements', mode);
}

/**
 * Returns the flat supplier analytics scorecard list.
 * Used by: Supplier Analytics module grid.
 */
export async function getSupplierAnalytics(
  filters: SupplierAnalyticsFilters
): Promise<Supplier[]> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierAnalytics(filters);
  return notImplemented('getSupplierAnalytics', mode);
}

/**
 * Returns the detail scorecard for a single supplier.
 * Used by: Supplier Analytics — detail drawer.
 */
export async function getSupplierDetail(
  supplierId: string
): Promise<SupplierAnalyticsSummary | null> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierDetail(supplierId);
  return notImplemented('getSupplierDetail', mode);
}

/**
 * Returns filter option lists for the filter bar dropdowns.
 * Used by: Overdue PO Workbench filter bar.
 */
export async function getFilterOptions(): Promise<ProcurementFilterOptions> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getFilterOptionsMock();
  return notImplemented('getFilterOptions', mode);
}

// ---------------------------------------------------------------------------
// Raw passthrough methods — Phase 6A
//
// These return the exact snake_case shapes that the existing frontend expects.
// API routes use these so no direct csvDataService imports remain in app/api/.
// The "Raw" suffix signals: snake_case output, no camelCase transformation.
// ---------------------------------------------------------------------------

/** Raw GlobalOverviewSummary — for GET /api/overview/summary */
export async function getGlobalOverviewSummaryRaw() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getGlobalOverviewSummaryRaw();
  return notImplemented('getGlobalOverviewSummaryRaw', mode);
}

/** Raw DashboardOverviewDetails — for GET /api/overview/details */
export async function getDashboardOverviewDetailsRaw() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getDashboardOverviewDetailsRaw();
  return notImplemented('getDashboardOverviewDetailsRaw', mode);
}

/** Raw paginated overdue worklist (snake_case items) — for GET /api/po-overdue/worklist */
export async function getOverdueWorklistRaw(filters: OverdueWorklistFilters) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getOverdueWorklistRaw(filters);
  return notImplemented('getOverdueWorklistRaw', mode);
}

/** Raw PO schedule-line detail (snake_case) — for GET /api/po-overdue/detail */
export async function getPurchaseOrderLineDetailRaw(
  poNumber: string,
  itemNumber: string,
  scheduleLine: string
) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv')
    return mockErp.getPurchaseOrderLineDetailRaw(poNumber, itemNumber, scheduleLine);
  return notImplemented('getPurchaseOrderLineDetailRaw', mode);
}

/** Raw acknowledgement summary — for GET /api/po-acknowledgement/summary */
export async function getAcknowledgementSummaryRaw() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getAcknowledgementSummaryRaw();
  return notImplemented('getAcknowledgementSummaryRaw', mode);
}

/** Raw paginated ack worklist (snake_case items) — for GET /api/po-acknowledgement/worklist */
export async function getAcknowledgementWorklistRaw(filters: AcknowledgementFilters) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getAcknowledgementWorklistRaw(filters);
  return notImplemented('getAcknowledgementWorklistRaw', mode);
}

/** Raw supplier analytics list (snake_case) — for GET /api/supplier-performance/list */
export async function getSupplierAnalyticsRaw(filters: SupplierAnalyticsFilters) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierAnalyticsRaw(filters);
  return notImplemented('getSupplierAnalyticsRaw', mode);
}

/** Raw supplier detail (snake_case) — for GET /api/supplier-performance/detail */
export async function getSupplierDetailRaw(supplierId: string) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierDetailRaw(supplierId);
  return notImplemented('getSupplierDetailRaw', mode);
}

/** Raw filter options — for GET /api/filters */
export async function getFilterOptionsRaw() {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getFilterOptionsRaw();
  return notImplemented('getFilterOptionsRaw', mode);
}

/** Raw guided action recommendation — for GET /api/recommendations */
export async function getRecommendationByExceptionRaw(
  exceptionId: string,
  poNumber: string,
  itemNumber: string,
  agentName: 'PO_OVERDUE_AGENT' | 'SUPPLIER_ACK_AGENT' | 'PART_AVAILABILITY_AGENT'
) {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') {
    return mockErp.getRecommendationByExceptionRaw(exceptionId, poNumber, itemNumber, agentName);
  }
  return notImplemented('getRecommendationByExceptionRaw', mode);
}

/** Get supplier contact email — service boundary read */
export async function getSupplierContactEmail(supplierId: string): Promise<string | undefined> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getSupplierContactEmail(supplierId);
  return notImplemented('getSupplierContactEmail', mode);
}

/** Get active purchase orders register — service boundary read */
export async function getPurchaseOrderRegisterRaw(): Promise<any[]> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getPurchaseOrderRegisterRaw();
  return notImplemented('getPurchaseOrderRegisterRaw', mode);
}

/** Get Control Tower Summary — service boundary read */
export async function getControlTowerSummaryRaw(): Promise<any> {
  const mode = DATA_SOURCE_CONFIG.mode;
  if (mode === 'mock_erp' || mode === 'csv') return mockErp.getControlTowerSummaryRaw();
  return notImplemented('getControlTowerSummaryRaw', mode);
}

