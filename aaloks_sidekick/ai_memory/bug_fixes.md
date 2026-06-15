# 🐛 Bug Fixes Log

*A catalog of technical bugs encountered and how they were resolved.*

### 1. Next.js inferred workspace root warning
* **Issue**: Next.js logs warning regarding multiple lockfiles detected in parent directory during builds.
* **Root Cause**: Workspace initialization inside a nested Desktop folder that shares common node configurations.
* **Fix**: Added `turbopack.root` parameter in `next.config.ts` to lock boundaries.

### 2. UI Drawer hidden behind scrolling viewport
* **Issue**: Drawer slides in but scrolls off-screen as the buyer scrolls down the overdue worklist.
* **Root Cause**: Drawer was styled with `flex` inside a scrollable layout.
* **Fix**: Restructured CSS to use `position: fixed` relative to viewport.

### 3. Missing API exports in backend service layer after Phase 1B merge
* **Issue**: REST API endpoints throw "Export getExceptionDetail doesn't exist" errors during compilation.
* **Root Cause**: Phase 1B custom layout changes replaced the entire contents of `csvDataService.ts` with a partial file containing only `getGlobalOverviewSummary()`, wiping out all Phase 1A query methods.
* **Fix**: Rebuilt the CSV service layer, combining the four original Phase 1A functions (overdue summaries, filtered worklists, dynamic dropdown options, row details drawer joins) with the new Phase 1B overview metrics function.

### 4. Mismatched JSX fragment tags in tab panels layout
* **Issue**: Next.js Turbopack compiler throws `Expected '</', got 'ident'` and JSX parsing failures.
* **Root Cause**: Conditional rendering tab triggers `{activeTab === 'overdue' && (<> ... )}` opened a JSX block but did not have the matching closing tags `</div> \n </>\n )}` at the bottom of the table layouts.
* **Fix**: Rebalanced all JSX container scopes and added the missing `</div>` tag to close the main body area before closing the fragment blocks.

### 5. CSV file path case sensitivity
* **Issue**: Sourcing data functions return empty array arrays on Linux/macOS filesystems but execute successfully on Windows servers.
* **Root Cause**: Linux filesystems are strictly case-sensitive, so loading `Exception_Worklist.csv` fails when the file is stored as `exception_worklist.csv`.
* **Fix**: Audited all file queries and locked all references to exact lowercase as saved in raw folders.

### 6. Strict TypeScript parameter 'src' implicitly has an 'any' type
* **Issue**: npx tsc compiler fails on build with `Parameter 'src' implicitly has an 'any' type` inside array maps.
* **Root Cause**: Mapping over arrays derived from `any` typed parent objects (like `msg.sources_used.map(src => ...)`) causes type inference failure on strict compilations.
* **Fix**: Added explicit type signatures to parameter signatures (e.g. `(src: string) => ...`) inside all such loops to ensure type validation.
