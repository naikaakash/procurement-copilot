# sap-assistant

A SAP integration playground that doubles as a **customer-demoable web app**.

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

## License

MIT.
