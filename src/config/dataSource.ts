/**
 * Data Source Configuration — Procurement Data Service
 *
 * Controls which adapter the Procurement Data Service uses to load data.
 *
 * Modes:
 *   "mock_erp"    — Active for Release 1. Calls csvDataService directly
 *                   (local CSV files in procurement_data_sample/).
 *   "csv"         — Alias for local CSV; treated the same as mock_erp today.
 *   "backend_api" — Future: calls a deployed backend/API middleware.
 *   "sap_odata"   — Future: calls SAP OData endpoints directly.
 *
 * IMPORTANT: Do not change mode to anything other than "mock_erp" until the
 * target adapter is fully implemented and verified.
 *
 * See: docs/INTEGRATION_CONTRACT.md for full architecture contract.
 */

export type DataSourceMode = 'mock_erp' | 'csv' | 'backend_api' | 'sap_odata';

export const DATA_SOURCE_CONFIG: { mode: DataSourceMode } = {
  mode: 'mock_erp'
};
