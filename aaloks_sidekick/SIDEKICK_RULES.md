# 📜 Aalok's Sidekick — AI Coding Guardrails

These rules are non-negotiable for any AI agent working on Aalok's projects. Read these rules before writing a single line of code.

## 🏗️ Architectural Rules
1. **Absolute Separation of Concerns**: All data ingestion, parsing (CSV/JSON/SQL), and data joins must live in a service/data-access layer. UI components must only call clean API endpoints.
2. **No Vibe-Coded Logic**: Do not guess calculation formulas. Overdue days, open values, and quantities must be clearly sourced, mathematically sound, and traceable.
3. **Hardcoded Limits**: No fake calculations or mock numbers. All dashboard KPIs must show aggregated counts sourced directly from the database or files.

## 🎨 UI/UX Design System Guidelines
1. **Enterprise Dark Slate**: Use sleek dark surfaces (`#090d16`, `#111726`) with harmony-tuned HSL accent highlights. No basic raw primary colors.
2. **Viewport Fixation**: Modals and side drawers must stay fixed on the viewport (`position: fixed`) while the main content scroll list remains long and scrollable.
3. **Micro-interactions**: Use subtle transitions, hover scaling, and clean severity chips (Critical, High, Medium, Low) rather than childish colors.

## 🤖 Interaction & Scope Protocol
1. **No Silent Scope Creep**: Do not implement unrequested AI chatbots, email drafts, or integrations. Keep focused purely on the active phase deliverables.
2. **Explain Decisions**: Document major architectural decisions in `architecture_decisions.md` and track changes inside `changelog.md`.
Aalok’s Sidekick should reuse technical patterns, architecture rules, workflow habits, prompts, checklists, bug fixes, UI preferences, and reusable templates. It must not blindly reuse project-specific content, client data, fake demo records, old supplier names, old PO numbers, screenshots, branding, or business assumptions unless explicitly approved for the new project.