# 📝 Application Build Journal

*Use this to log important decisions during active building.*

### 📅 May 2026 — Phase 1A: PO Overdue Dashboard
* **Decision**: Decoupled the data access layer by putting all CSV parsing in `/src/services/data/csvDataService.ts`.
* **Rationale**: Sourced all operations from a clean data service return. This allows the backend to be completely swapped out for a PostgreSQL Prisma client in Phase 1B without touching React components or API routes.
* **Decision**: Changed viewport from restricted overflow to full-page scroll, pinning the detail drawer as a `position: fixed` panel.
* **Rationale**: Provides top-tier desktop usability, allowing buyers to scroll wide tables without losing context of the drawer.

### 📅 June 2026 — Phase 2: Guided Actions & Analytics
* **Decision**: Implemented an algorithmic composite Priority Score (0–100) inside `CalcPriorityScore()` based on item severity, days past due, and estimated financial exposure.
* **Decision**: Decoupled the Exception Analytics, Supplier Analytics, and Buyer Productivity calculations entirely to the backend service layer (`csvDataService.ts`), leaving UI route files thin.
* **Decision**: Upgraded design aesthetics to a professional Premium Slate Dark Theme (`#0a0e17` backgrounds, `#111827` elevated cards, glassmorphic filters, and linear CSS gradients) using pure vanilla CSS.

### 📅 June 2026 — Phase 3A: AI Sourcing Copilot
* **Decision**: Implemented a server-side route `/api/copilot/chat` utilizing native `fetch()` calls to Gemini generateContent and Azure OpenAI completions API schemas.
* **Rationale**: Keeps the codebase extremely lightweight and dependency-free, avoiding the need for heavy external SDK packages.
* **Decision**: Added dynamic system-wide data snapshots, plant health status metrics, and unified Priority Exception items directly into the system prompt to facilitate high-cohesion RAG queries.
* **Decision**: Built custom client-side markdown parsers (`renderMarkdown`, `parseBold`) inside `page.tsx` to format paragraph lists, code segments, headers, and bold text natively inside dark CSS views.
