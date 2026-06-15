# 🧠 Project Memory — Claude Version
## Procurement Buyer/Planner Action Workbench

**Purpose:** This folder gives Claude instant orientation at the start of every session.  
**Rule:** Always read this file first, then read the specific context file for your current task.

---

## 📍 Where We Are

| Item | Value |
|---|---|
| Project | `buyer-planner-action-workbench` (Claude version) |
| Base project | `C:\Users\Aalok\Desktop\AI Projects\Procurement 3 Agent project\buyer-planner-action-workbench` |
| Claude version | `buyer-planner-action-workbench-claude` (sibling folder — DO NOT touch base project) |
| Stack | Next.js 16 · React 19 · TypeScript 5 · CSV data layer |
| Last known state | Phases 1 + 2 complete. Phase 2E (Buyer Productivity) in progress. |
| Graph snapshot | `graph.html` — 358 nodes, 356 edges, central hub = `csvDataService.ts` |

---

## 🗺️ Memory Files in This Folder

| File | What It Contains |
|---|---|
| `phase_status.md` | Which phases/features are done, in-progress, or not started |
| `architecture_snapshot.md` | How the codebase is structured — layers, key files, data flow |
| `api_contracts.md` | All existing API routes + their function signatures |
| `new_apis_needed.md` | APIs Claude must add for Phases 3–5 |
| `ui_patterns.md` | Dark-theme design rules, component patterns, CSS conventions |
| `data_model.md` | All 26 CSV files, their key fields, and join relationships |
| `coding_rules.md` | How to write code in this project — what to follow, what to avoid |
| `phase_build_log.md` | Running log of what Claude has built in the Claude version |
| `known_issues.md` | Bugs found and fixed; gotchas to remember |

---

## ⚡ Quick Context

- All data access goes through `src/services/data/csvDataService.ts`. **Never** read CSVs directly in API routes or UI.
- The entire UI is in `app/page.tsx` (~4,000 lines). For new phases, create new tab sections inside this file or extract to `/components`.
- API routes in `app/api/` are thin — they call one service function and return JSON.
- The `procurement_data_sample/` folder holds 26 CSV files. The Claude version **symlinks or copies** these — it does not have its own data.
- Dark slate theme: `#0f0f1a` background, `#1a1a2e` panels, glassmorphism cards, no external CSS libraries.

---

## 🚦 Phase Status at a Glance

```
Phase 1 — Visibility Foundation       ✅ COMPLETE
Phase 2 — Guided Actions              ✅ COMPLETE (2E in progress)
Phase 3 — AI Assistance               🔲 NOT STARTED (Claude version builds this)
Phase 4 — Workflow Automation         🔲 NOT STARTED (Claude version builds this)
Phase 5 — Autonomous Agents           🔲 NOT STARTED (Claude version builds this)
```

---

## 🔑 Cardinal Rules for Claude in This Project

1. **Never modify the base project** — all work goes in the Claude version folder
2. **Data isolation** — all data logic lives in `csvDataService.ts`; API routes are thin wrappers
3. **No external UI libraries** — vanilla CSS only, dark slate theme
4. **Server-side computation** — calculations happen in API routes, not in the browser
5. **Incremental, non-breaking** — new phases add tabs/routes; they don't restructure existing ones
6. **TypeScript strict** — all new types must be exported from `csvDataService.ts`
