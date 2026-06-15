# 📖 How to Use Aalok's Sidekick

Use these exact short commands when interacting with any AI agent. Copy the text block or tell the agent: *"Read /aaloks_sidekick/HOW_TO_USE_SIDEKICK.md before responding."*

---

## ⚡ Short Trigger Commands

### 1. Start of Project
> **Command**: `“Hey Sidekick — bootstrap this project using old me.”`
> **Action**: AI reads `/aaloks_sidekick`, extracts patterns, structures folders, sets architecture guardrails, and prepares the implementation plan.

### 2. End of Phase
> **Command**: `“Hey Sidekick — curate Phase 1A.”` (or 1B, 2, etc.)
> **Action**: Triggers the **Memory Curator Agent** to analyze completed work, catalog bugs fixed, record prompts that succeeded, update the changelog, and clean the codebase.

### 3. Before Coding a Feature
> **Command**: `“Hey Sidekick — prepare the agents and guardrails for this feature.”`
> **Action**: Instantiates the relevant dev agents (Solution Architect, QA Agent, Frontend Developer) to formulate acceptance criteria and review coding standards.

### 4. After Bugs are Fixed
> **Command**: `“Hey Sidekick — store this bug and fix for future projects.”`
> **Action**: Log details inside `bug_fixes.md` describing the issue, root cause, and copy-pasteable fix patterns.

### 5. Before Copying to a New Project
> **Command**: `“Hey Sidekick — package old me for reuse.”`
> **Action**: Aggregates all reusable templates and bootstraps them inside `starter_kits/` for future projects.
