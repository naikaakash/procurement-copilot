# 🏗️ Architecture Design Overview

## Data Flow Diagram
```
[Relational CSV Files] ---> [csvDataService.ts Layer] ---> [API route handlers] ---> [React/Next.js UI Page]
```

## Key Architectural Principles
* **Decoupled Sourcing**: In Phase 1B, the CSV data access layer inside `csvDataService.ts` will be replaced by a Prisma query service. Frontend components and route parameters will remain entirely unchanged.
* **Fixed Position Drawer**: Details sidebar uses fixed viewport constraints to protect layout integrity.
