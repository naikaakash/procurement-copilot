# 📐 Coding Rules — Claude Version

Rules Claude must follow when writing code in this project.

---

## Golden Rules

1. **All data access → `csvDataService.ts`**  
   Never import `csv` or read files anywhere else. Add a new typed function, export it, import it in the API route.

2. **API routes are thin**  
   A route.ts should be ~20–40 lines: parse params, call one service function, return `NextResponse.json(result)`.

3. **TypeScript strict**  
   All return types must be explicitly typed. Export interfaces from `csvDataService.ts`. Import them in routes and page.tsx.

4. **No external UI libraries**  
   No shadcn, no Tailwind, no MUI. Vanilla CSS only. Use the variables in `globals.css`.

5. **Server-side secrets**  
   Anthropic API key goes in `.env.local` as `ANTHROPIC_API_KEY`. Never reference it in client code (`page.tsx`).

---

## Adding a New Service Function

```typescript
// IN csvDataService.ts — at bottom of file:

// 1. Define the return type
export interface BuyerProductivityItem {
  buyer_id: string;
  total_assigned: number;
  open_count: number;
  resolved_count: number;
  resolution_rate_pct: number;
  avg_days_to_resolve: number;
  financial_exposure: number;
}

// 2. Implement the function
export async function getBuyerProductivity(): Promise<BuyerProductivityItem[]> {
  const exceptions = await readCsv('exception_worklist.csv');
  
  // Group by buyer
  const byBuyer = new Map<string, any[]>();
  for (const ex of exceptions) {
    const buyer = ex.assigned_buyer || 'UNASSIGNED';
    if (!byBuyer.has(buyer)) byBuyer.set(buyer, []);
    byBuyer.get(buyer)!.push(ex);
  }
  
  // Calculate metrics per buyer
  return Array.from(byBuyer.entries()).map(([buyer_id, items]) => {
    const open = items.filter(i => i.status !== 'RESOLVED');
    const resolved = items.filter(i => i.status === 'RESOLVED');
    // ... calculate metrics
    return { buyer_id, total_assigned: items.length, /* ... */ };
  });
}
```

---

## Adding a New API Route

```typescript
// CREATE: app/api/buyer-productivity/route.ts

import { NextResponse } from 'next/server';
import { getBuyerProductivity } from '@/src/services/data/csvDataService';

export async function GET(request: Request) {
  try {
    const data = await getBuyerProductivity();
    return NextResponse.json({ data, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Buyer productivity error:', error);
    return NextResponse.json({ error: 'Failed to load buyer productivity' }, { status: 500 });
  }
}
```

---

## Calling Anthropic API (Phase 3+)

```typescript
// IN an API route — NEVER in page.tsx

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'You are a procurement analyst assistant. Answer concisely based on the data provided.',
    messages: [
      { role: 'user', content: `Data context: ${JSON.stringify(contextData)}\n\nQuestion: ${userQuestion}` }
    ],
  }),
});

const data = await response.json();
const reply = data.content[0].text;
```

---

## Formatting Currency

```typescript
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
```

---

## Formatting Dates

```typescript
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}
```

---

## Common Gotchas

| Gotcha | Fix |
|---|---|
| Drawer hides behind scrollable viewport | Use `position: fixed` on drawer |
| JSX fragment tags mismatched | Always close `<>` with `</>`, not `</React.Fragment>` |
| Missing exports after adding function | Export both the type interface AND the function |
| `cache` not defined on first access | `let cache: Record<string, any[]> = {}` at module top level |
| API returns 500 on first load | Check that the CSV file name matches exactly (case-sensitive on Linux) |
| `process.env.ANTHROPIC_API_KEY` undefined | Must be in `.env.local`, not `.env`; server restart required |
