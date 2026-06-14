---
mode: agent
description: Add a new authenticated SPA page to SapAssistant.Web
---

# Add a new page to the React SPA

## Inputs you need

- **Route path** (e.g. `/inventory`).
- **Page name** (e.g. `Inventory`).
- **Backend endpoint(s)** it consumes (link to the C# endpoint file).
- **Auth?** Default **yes** (wrap in `<RequireAuth>`).

## Files to touch

1. **Create** `src/SapAssistant.Web/src/pages/{Page}.tsx`:
   - Function component, named export.
   - `useState` / `useEffect` for local state. No Redux, no React Query unless caching is actually needed.
   - Fetch via `apiGet` / `apiPost` from `src/lib/api.ts`.
   - Tailwind v4 utility classes only.

2. **Register the route** in `src/SapAssistant.Web/src/App.tsx`:
   ```tsx
   <Route element={<RequireAuth><Layout/></RequireAuth>}>
     <Route path="{path}" element={<{Page}/>} />
   </Route>
   ```

3. **Navigation**: if the page should appear in the nav, update
   `src/SapAssistant.Web/src/components/Layout.tsx`.

4. **E2E test**: add `tests/e2e/tests/{page}.spec.ts`. Sign in via `signIn`,
   navigate to the route, assert the key UI element is visible, exercise the
   primary interaction.

## Conventions reminder

- Keep components small (~150 lines). Extract sub-components when reused.
- Every interactive element needs an accessible name (`aria-label`, visible text, or `<label>`).
- Render a loading placeholder during fetch and a friendly message on failure.

## Verification

```bash
cd src/SapAssistant.Web && npm run build
cd tests/e2e && npm run prepare:all && npm test
```
