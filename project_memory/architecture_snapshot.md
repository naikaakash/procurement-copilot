# 🏛️ Architecture Snapshot
_Derived from graphify graph: 358 nodes · 356 edges · csvDataService.ts degree=60_

---

## Layer Map

```
┌─────────────────────────────────────────────────┐
│  UI Layer — app/page.tsx (~4,000 lines)          │
│  6 tabs: Overview | OD | Acks | Parts | Supplier │
│           | Exception Analytics                   │
│  + Phase 2E: Buyer Productivity (in progress)    │
│  + Phase 3+: New tabs added here                 │
└──────────────┬──────────────────────────────────┘
               │ fetch()
┌──────────────▼──────────────────────────────────┐
│  API Layer — app/api/**/route.ts                 │
│  15 existing routes (GET/POST)                   │
│  Each route: 1 import + 1 service call + JSON   │
└──────────────┬──────────────────────────────────┘
               │ calls
┌──────────────▼──────────────────────────────────┐
│  Service Layer — src/services/data/              │
│  csvDataService.ts (~1,950 lines)                │
│  THE BRAIN: all joins, calculations, caching     │
│  In-memory Map cache; resets on server restart   │
└──────────────┬──────────────────────────────────┘
               │ reads
┌──────────────▼──────────────────────────────────┐
│  Data Layer — procurement_data_sample/ (26 CSVs) │
│  Read via csvtojson library                      │
│  Cached after first read (server-side)           │
└─────────────────────────────────────────────────┘
```

---

## Key Files

| File | Size | Role |
|---|---|---|
| `app/page.tsx` | ~4,000 lines | Entire frontend — all tabs, all React state |
| `src/services/data/csvDataService.ts` | ~1,950 lines | All data logic — joins, KPIs, caching |
| `app/api/*/route.ts` | ~20–50 lines each | 15 thin API route handlers |
| `app/globals.css` | medium | Dark theme variables, sidebar, table styles |
| `app/layout.tsx` | small | Root HTML wrapper, Geist font imports |

---

## Graph-Confirmed API Routes (all existing)

```
GET  /api/overview/summary          → getGlobalOverviewSummary()
GET  /api/overview/details          → getDashboardOverviewDetails()
GET  /api/po-overdue/summary        → getOverdueSummary()
GET  /api/po-overdue/worklist       → getOverdueWorklist(filters)
GET  /api/po-overdue/detail         → getExceptionDetail(po, item, line)
GET  /api/po-acknowledgement/summary → getAcknowledgementSummary()
GET  /api/po-acknowledgement/worklist → getAcknowledgementWorklist(filters)
GET  /api/part-availability/summary → getPartSummary()
GET  /api/part-availability/worklist → getPartWorklist(filters)
GET  /api/part-availability/mrp    → getPartMrpTimeline(material, plant)
GET  /api/supplier-performance/list → getSupplierPerformanceList(filters)
GET  /api/supplier-performance/detail → getSupplierPerformanceDetail(id)
GET  /api/exception-analytics       → getExceptionAnalytics()
GET  /api/filters                   → getFilterOptions()
GET  /api/recommendations           → getRecommendationByException(...)
POST /api/recommendations           → updateRecommendationStatus(...)
```

---

## Data Flow Pattern (how every feature is built)

```
1. Add typed function to csvDataService.ts
2. Add new route.ts in app/api/<feature>/route.ts
3. Add fetch + state in page.tsx
4. Render in a new tab section in page.tsx
```

---

## In-Memory Caching

```typescript
// Server-side module-level cache
let cache: Record<string, any[]> = {};

async function readCsv(filename: string): Promise<any[]> {
  if (cache[filename]) return cache[filename];  // instant hit
  const data = await csv().fromFile(path.join(DATA_ROOT, filename));
  cache[filename] = data;
  return data;
}
```

Resets on `npm run dev` restart. Acceptable for MVP; Phase 4+ will need persistent storage.

---

## TypeScript Path Alias

```json
// tsconfig.json
"paths": { "@/*": ["./*"] }
```

Use `import { X } from '@/src/services/data/csvDataService'` in API routes.

---

## Component Patterns in page.tsx

```typescript
// Interface types (defined in csvDataService.ts, imported via API)
interface WorklistItem { ... }
interface ExceptionDetail extends WorklistItem { ... }

// State pattern
const [worklistData, setWorklistData] = useState<WorklistItem[]>([]);
const [loading, setLoading] = useState(false);

// Fetch pattern
async function loadWorklist() {
  setLoading(true);
  const res = await fetch('/api/po-overdue/worklist?limit=25&offset=0');
  const json = await res.json();
  setWorklistData(json.items);
  setLoading(false);
}
```
