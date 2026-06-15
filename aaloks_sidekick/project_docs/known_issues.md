# ⚠️ Known Issues & System Constraints

* **Reference Date**: The procurement dataset relative time baseline is capped at `2026-05-28`. Overdue calculations rely on this hardcoded reference point to stay consistent.
* **Pagination**: Dynamic pagination offset parameters are currently limited by in-memory cache arrays. Full DB paging will be completed in Phase 1B.
