---
name: 🤖 Copilot agent task
about: A well-scoped task you want the GitHub Copilot cloud agent to pick up.
title: "[copilot] <short imperative summary>"
labels: ["copilot"]
assignees: []
---

<!--
Assign this issue to @copilot (or use the "Code with Copilot" button in the
GitHub UI) to have the cloud coding agent open a PR for it.

The agent will:
- Run .github/workflows/copilot-setup-steps.yml to set up its environment
- Read .github/copilot-instructions.md for conventions
- Pick a matching prompt from .github/prompts/ if relevant
- Open a draft PR with the changes + a description

To get a good PR back, this issue body MUST be specific. Use the sections
below — delete the ones that don't apply.
-->

## Goal

<!-- One sentence: what does "done" look like for an end-user? -->

## Why

<!-- Optional but helpful: 1-2 lines of context. What's currently broken or missing? -->

## In scope

<!--
The concrete change you want. Be specific about:
- files / folders involved (or "agent's choice, but justify")
- public API shape (endpoint path, props, etc.)
- UX (route, copy, key interactions)
-->

## Out of scope

<!--
Things the agent should NOT touch. Examples:
- "don't change the auth wiring"
- "don't touch infra/main.bicep — open a separate issue if needed"
-->

## Acceptance criteria

<!-- Checklist the agent (and reviewer) can verify. -->

- [ ] `dotnet build SapAssistant.sln` passes
- [ ] `dotnet test SapAssistant.sln` passes
- [ ] `cd tests/e2e && npm run prepare:all && npm test` passes
- [ ] <!-- new behavior assertion #1 -->
- [ ] <!-- new behavior assertion #2 -->

## Hints (optional)

<!--
Pointers that save the agent time:
- "Mirror the structure of src/SapAssistant.Api/Endpoints/ContestEndpoints.cs"
- "See .github/prompts/add-endpoint.prompt.md"
- "Stub the SAP call with ISapClient for now"
-->
