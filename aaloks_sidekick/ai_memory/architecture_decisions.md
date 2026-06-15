# 🏛️ Architectural Decision Records (ADR)

## ADR-001: Decoupled Service Layer for Data Access

* **Status**: Accepted
* **Context**: Sourcing local CSV data files for Phase 1A MVP instead of live PostgreSQL.
* **Decision**: We will wrap all parsing, relational joins, and overdue metrics inside a dedicated `/src/services/data/` layer. UI code and route handlers will only communicate via standard JSON interfaces.
* **Consequences**: Swapping to live PostgreSQL Prisma client in Phase 1B will require zero edits to Next.js UI components.

## ADR-002: Fixed-Viewport Side Panel for Responsive Layouts

* **Status**: Accepted
* **Context**: Need to view long overdue PO tables while inspecting specific line logs.
* **Decision**: Outer layout will support scroll overflow, while detail drawers will use viewport fixed position.
* **Consequences**: User can scroll long tables without losing screen alignment of the drawer.
