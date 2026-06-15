# 📝 Project Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] — 2026-05-29
### Added
* Sourced new `getGlobalOverviewSummary()` metrics in `csvDataService.ts` to calculate total/open PO lines, overdue lines, missing acknowledgements, ASN delays, and safety stocks.
* Implemented modular tabbed navigation header in UI (`Overview`, `Purchase Orders`, `Overdue`, `Suppliers`, `Materials`, `Inventory`, `ASN`, `Acknowledgements`).
* Added a dynamic "Entries to display" selector (15, 25, 50, 100 size dropdown) next to the overdue worklist table title.

### Fixed
* Restored missing core data parser methods (`getOverdueSummary`, `getOverdueWorklist`, `getExceptionDetail`, and `getFilterOptions`) in `csvDataService.ts` after Phase 1B installation had accidentally wiped them.
* Rebalanced and fixed mismatched JSX closing tags in `app/page.tsx` that broke the layout.
* Restructured main layout from constrained flex block height to native browser viewport scroll to enable vertical table expansion.

---

## [1.0.0] — 2026-05-29
### Added
* Decoupled `csvDataService.ts` parsing 26 relational supply chain CSVs.
* Aggregated dashboard showing 8 real-time PO overdue KPI metrics.
* Premium filter bar supporting plant, supplier, and entries size dropdowns.
* Fixed position details drawer sliding in dynamically with on-time delivery percentages and risk profiles.
* Portable **Aalok's Sidekick** AI development memory skeleton.
