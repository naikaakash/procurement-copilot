# sap-assistant

A SAP integration playground that doubles as a **customer-demoable web app**.

[![build-test](https://github.com/naikaakash/sap-assistant/actions/workflows/build-test.yml/badge.svg)](https://github.com/naikaakash/sap-assistant/actions/workflows/build-test.yml)
[![infra](https://github.com/naikaakash/sap-assistant/actions/workflows/infra.yml/badge.svg)](https://github.com/naikaakash/sap-assistant/actions/workflows/infra.yml)
[![deploy](https://github.com/naikaakash/sap-assistant/actions/workflows/deploy.yml/badge.svg)](https://github.com/naikaakash/sap-assistant/actions/workflows/deploy.yml)
[![copilot-setup-steps](https://github.com/naikaakash/sap-assistant/actions/workflows/copilot-setup-steps.yml/badge.svg)](https://github.com/naikaakash/sap-assistant/actions/workflows/copilot-setup-steps.yml)

> Status: **MVP scaffold** — backend `.NET 9` + frontend `React 19 + Vite + Tailwind v4`, orchestrated locally by [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/), hosted on Azure Container Apps.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | ASP.NET Core 9 Minimal APIs |
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 |
| Local orchestration | .NET Aspire 9.5 |
| Auth | Microsoft Entra ID (OIDC, cookie sessions) — GitHub + Google planned |
| Storage (MVP) | Excel-in-Blob (Azure Blob + ClosedXML) |
| Storage (later) | Azure Table Storage / Azure SQL |
| AI / chatbot | Stubbed — will swap in Semantic Kernel + Azure OpenAI |
| SAP integration | Stubbed `ISapClient` — will swap in SAP NCo |
| Hosting | Azure Container Apps |
| Container registry | GitHub Container Registry (GHCR) |
| Secrets | Azure Key Vault + GitHub Actions OIDC |
| Observability | Application Insights + OpenTelemetry |
| CI/CD | GitHub Actions |
| Tests | xUnit + WebApplicationFactory + Playwright |

---

## Quickstart (local dev)

Prerequisites: **.NET 9 SDK**, **Node.js 22+**, **Docker Desktop** (only needed once you start building images).

```bash
# 1. Clone
git clone git@github.com:naikaakash/sap-assistant.git
cd sap-assistant

# 2. Restore .NET + install npm packages
dotnet restore
(cd src/SapAssistant.Web && npm install)

# 3. Run the whole app (API + Vite dev server) with one command
dotnet run --project src/SapAssistant.AppHost
```

Then open the **Aspire dashboard** URL printed in the console. From there you can jump to:
- `web` → http://localhost:5173 (React app)
- `api` → http://localhost:5000 (.NET API)
- `/api/hello` → JSON payload from the backend

---

## Project layout

```
sap-assistant/
├── src/
│   ├── SapAssistant.Api/             # ASP.NET Core 9 Minimal API
│   ├── SapAssistant.Web/             # React 19 + Vite + Tailwind v4 SPA
│   ├── SapAssistant.AppHost/         # Aspire orchestrator (local dev)
│   └── SapAssistant.ServiceDefaults/ # Shared OTel / health / resilience
├── tests/
│   └── SapAssistant.Api.Tests/       # xUnit + WebApplicationFactory
├── infra/                            # Bicep — production Azure footprint
├── Dockerfile                        # Multi-stage build (Node + .NET SDK -> ASP.NET runtime)
├── .github/workflows/                # build-test, infra, deploy
├── docs/                             # Architecture + onboarding (added later)
└── SapAssistant.sln
```

---

## Build & test

```bash
dotnet build                                     # build everything
dotnet test                                      # run unit + integration tests
(cd src/SapAssistant.Web && npm run build)       # type-check + build SPA
(cd src/SapAssistant.Web && npm run lint)        # ESLint
```

### Debugging real Microsoft sign-in locally

`scripts/run-local-real-auth.ps1` runs the API on `http://localhost:5000`
with the **real Entra OIDC flow** (reads ClientId/Secret/TenantId from Key
Vault via your `az login`), serving the SPA from `wwwroot/` — same
single-origin setup as production. Use this to debug sign-in issues without
deploying.

```pwsh
pwsh ./scripts/run-local-real-auth.ps1            # http://localhost:5000 (default)
pwsh ./scripts/run-local-real-auth.ps1 -Https     # https://localhost:5001 (needs `dotnet dev-certs https --trust`)
pwsh ./scripts/run-local-real-auth.ps1 -SkipBuild # reuse last SPA build
```

The console prints verbose `Microsoft.AspNetCore.Authentication` and
`Microsoft.Identity.Web` logs so you can see exactly which step fails
(correlation cookie missing, nonce mismatch, etc.).

---

## Production deployment

Live URL: **https://sapassistant-app.victoriousplant-c4f6558d.eastus2.azurecontainerapps.io**

Azure resources are described declaratively in [`infra/main.bicep`](./infra/main.bicep). CI/CD lives in [`.github/workflows/`](./.github/workflows/):

| Workflow | Trigger | What it does |
|---|---|---|
| `build-test.yml` | PR + push | restore/build/test .NET + build the SPA |
| `infra.yml`      | push touching `infra/**` | `az deployment group create` |
| `deploy.yml`     | push touching `src/**` or `Dockerfile` | docker build → push to GHCR → `az containerapp update --image` |

### CI/CD already wired

The Bicep is already deployed and the GitHub Actions OIDC federation is set up: pushing to `main` automatically builds the image, pushes it to GHCR, and rolls a new Container App revision. No secrets to copy by hand.

### Roadmap

This MVP is the foundation; subsequent phases add real OAuth, Excel-in-Blob persistence, containerization, deployment to Azure Container Apps, SAP NCo integration, and a real chatbot (Semantic Kernel + Azure OpenAI).

See `docs/` (after Phase 8) for full architecture and onboarding.

---

## AI-ready repo

This repo is set up so AI coding agents (GitHub Copilot, Copilot CLI, Cursor, Codex)
can land clean PRs without tribal knowledge.

| File / dir | Who reads it | What it does |
|---|---|---|
| [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) | All Copilot surfaces (chat, CLI, cloud agent) | Architecture invariants + coding conventions + commands |
| [`AGENTS.md`](./AGENTS.md) | Codex, Claude Code, generic `AGENTS.md`-aware tooling | Points at `copilot-instructions.md` |
| [`.github/workflows/copilot-setup-steps.yml`](./.github/workflows/copilot-setup-steps.yml) | GitHub Copilot **cloud coding agent** | Preinstalls .NET 9, Node 24, npm packages, Playwright browsers before the agent starts work |
| [`.github/prompts/`](./.github/prompts/) | Copilot Chat slash-commands | Reusable templates: `add-endpoint`, `add-page`, `add-bicep-resource` |
| [`.github/ISSUE_TEMPLATE/copilot-task.md`](./.github/ISSUE_TEMPLATE/copilot-task.md) | Humans filing work for the cloud agent | Forces well-scoped issues so the agent can succeed |
| [`.github/pull_request_template.md`](./.github/pull_request_template.md) | Anything that opens a PR | Standard checklist + blast-radius flag |
| [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json) | Codespaces + VS Code Dev Containers | One-click dev env with .NET 9, Node 24, Docker, az, gh, pwsh + all deps |
| [`.vscode/mcp.json`](./.vscode/mcp.json) | VS Code MCP-aware agents | Pre-wires GitHub + Playwright MCP servers |
| [`.vscode/extensions.json`](./.vscode/extensions.json) | VS Code | Recommends C# / Bicep / Tailwind / Playwright / Copilot extensions |

### Filing work for the GitHub Copilot cloud agent

1. Open a new issue and pick the **🤖 Copilot agent task** template.
2. Fill in the **Goal**, **In scope**, **Out of scope**, and **Acceptance criteria** sections.
3. Assign the issue to `@copilot` (or use the **Code with Copilot** button in the GitHub UI).
4. The cloud agent will:
   - Run `copilot-setup-steps.yml` to bring up its environment
   - Read `copilot-instructions.md` for conventions
   - Open a **draft PR** with the change + test results
5. Review like any human PR. The standard CI (`build-test` + `infra` + `deploy`) will run on the PR branch.

### One-click Codespace

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/naikaakash/sap-assistant)

---

## License

MIT.
