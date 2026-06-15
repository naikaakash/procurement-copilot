# ⚠️ Known Issues & Gotchas

Inherited from base project's ai_memory/bug_fixes.md + new Claude version notes.

---

## Inherited from Base Project

### 1. Next.js inferred workspace root warning
**Symptom:** Console warning about workspace root inference  
**Fix:** Add `"name"` field to `package.json` — already present in base project  
**Status:** ✅ Fixed in base project, copy fix when cloning

### 2. UI Drawer hidden behind scrolling viewport
**Symptom:** Detail drawer slides in but hides behind page content  
**Fix:** Use `position: fixed` (not `absolute`) on drawer CSS  
**Status:** ✅ Fixed in base project — follow same pattern in all new drawers

### 3. Missing API exports after adding functions to csvDataService.ts
**Symptom:** TypeScript compile error "X is not exported"  
**Fix:** Every new interface AND function must have `export` keyword  
**Status:** Known gotcha — always check exports before build

### 4. Mismatched JSX fragment tags
**Symptom:** Compile error in page.tsx around tab panels  
**Fix:** Use `<>` / `</>` consistently; don't mix with `<React.Fragment>`  
**Status:** Known gotcha — happens when copy-pasting tab sections

---

## Claude Version Specific

### 5. CSV file path case sensitivity
**Symptom:** `readCsv()` returns empty array on Linux but works on Windows  
**Root cause:** Linux filesystem is case-sensitive; Windows is not  
**Fix:** Always use exact lowercase filename as it appears in `procurement_data_sample/`  
**Status:** Watch for this when adding new CSV reads

### 6. Anthropic API key not available at runtime
**Symptom:** `process.env.ANTHROPIC_API_KEY` is `undefined` in API routes  
**Fix:**  
1. Create `.env.local` in project root (never commit this file)  
2. Add `ANTHROPIC_API_KEY=sk-ant-...`  
3. Restart dev server — Next.js only reads `.env.local` at startup  
**Status:** Must configure before Phase 3 work

### 7. In-memory recommendation state resets on server restart
**Symptom:** Approved/rejected recommendations revert after `npm run dev` restart  
**Root cause:** State stored in server-side Map (by design for MVP)  
**Fix:** Acceptable for Phase 3 MVP. Phase 4+ needs database persistence.  
**Status:** Known limitation — document for stakeholders

### 8. Large CSV join performance
**Symptom:** First page load slow (2–4 seconds) when joining multiple large CSVs  
**Root cause:** All 26 files read from disk and cached on first access  
**Fix:** Caching makes subsequent requests fast. Consider pre-warming on startup.  
**Status:** Acceptable for MVP. Monitor with >100 concurrent users.
