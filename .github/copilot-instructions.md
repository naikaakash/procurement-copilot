# Copilot / AI-agent instructions for `sap-assistant`

This file is read by GitHub Copilot, Copilot CLI, Cursor, Codex, and any other
AI assistant working in this repo. **Read it before generating code.**

The goal of this repo is to be **agent-friendly**: any reasonable AI agent
should be able to land a clean PR by following the conventions below, without
breaking conventions or asking the human to fill in tribal knowledge.

---

## What this repo is

A demoable SAP-integration playground. Single web app, single deployable
artifact, single live URL.

- **Backend**: `src/SapAssistant.Api/` — ASP.NET Core 9 Minimal APIs.
- **Frontend**: `src/SapAssistant.Web/` — React 19 + Vite + TypeScript + Tailwind v4 SPA.
- **Local dev orchestration**: `src/SapAssistant.AppHost/` — .NET Aspire 9.5
  (runs API + Vite + observability dashboard together).
- **Shared OTel/health/resilience**: `src/SapAssistant.ServiceDefaults/`.
- **Tests**: `tests/SapAssistant.Api.Tests/` (xUnit + WebApplicationFactory),
  `tests/e2e/` (Playwright against the built Docker image / SPA-in-wwwroot).
- **Infra**: `infra/main.bicep` — Azure Container Apps + Key Vault + UAMI + App Insights + Log Analytics.
- **CI/CD**: `.github/workflows/` — `build-test`, `infra`, `deploy`.

The deployable artifact is a single Docker image: SPA built with Vite → copied
into `src/SapAssistant.Api/wwwroot/` → ASP.NET Core serves both API and static
files. There is **no separate frontend host** in production.

---

## Architecture invariants — do not violate

1. **Single image, single Container App.** Don't introduce a separate
   frontend host or split the API into microservices. If you need to add a
   long-running worker, prefer an in-process `BackgroundService`.
2. **Minimal APIs only.** No MVC controllers. Endpoints are extension methods
   on `IEndpointRouteBuilder` in `src/SapAssistant.Api/Endpoints/` named
   `Map{Feature}Endpoints`.
3. **Authentication is cookie-based**, configured via
   `services.AddSapAuth(config, env)`. **Do not** use `ConfigureApplicationCookie`
   (that targets the wrong scheme — `Identity.Application`). Configure
   `CookieAuthenticationDefaults.AuthenticationScheme` directly.
4. **OIDC uses auth code flow + PKCE + SameSite=Lax cookies.** Do not switch
   back to `response_type=id_token` / `response_mode=form_post` — Edge tracking
   prevention silently drops the cross-site SameSite=None cookies, breaking
   sign-in.
5. **TLS is terminated at Container Apps ingress.** `UseForwardedHeaders` is
   required and already wired. Don't disable it.
6. **DataProtection keys are container-local today.** Until the Blob+KV-backed
   DataProtection lands, `minReplicas: 1` MUST stay in `infra/main.bicep` —
   otherwise scale-to-zero rotates the keys mid sign-in and you get
   `ERR_UNSAFE_REDIRECT`.
7. **Secrets**: never commit. Use Azure Key Vault references in
   `infra/main.bicep` and the User-Assigned Managed Identity for runtime
   access. Local dev reads from User Secrets (`dotnet user-secrets`) or
   `appsettings.Development.json` (gitignored values only).

---

## Conventions

### Backend (C# / .NET 9)

- **File layout**: one class per file, namespace = folder path.
- **Endpoint files**: `src/SapAssistant.Api/Endpoints/{Feature}Endpoints.cs`,
  exposing a single `public static IEndpointRouteBuilder Map{Feature}Endpoints(
  this IEndpointRouteBuilder app)`. Register in `Program.cs`.
- **Dependency injection**: prefer constructor injection. Register services
  next to the consumer of the abstraction (e.g. `IChatService` near where
  chat endpoints are wired). Use `AddSingleton` for stateless services,
  `AddScoped` for anything touching `HttpContext` / per-request state.
- **Records over classes** for DTOs / request / response models.
- **Nullable reference types**: enabled repo-wide via `Directory.Build.props`.
  Honor it — no `!` assertions unless commented why.
- **Async**: every IO-bound method takes a `CancellationToken` and returns
  `Task` / `Task<T>`. Use `await` even on `Task.FromResult` returns inside
  async methods.
- **Auth on endpoints**: default to `[Authorize]` via `.RequireAuthorization()`
  on the group. Opt out with `.AllowAnonymous()`. Never trust client claims —
  re-read from `User.FindFirstValue(...)`.
- **Logging**: structured logging via `ILogger<T>`. Don't `Console.WriteLine`.
- **Error responses**: return `Results.Problem(...)` (RFC 7807) for failures,
  never plain text.

### Frontend (React 19 / TypeScript)

- **Components**: function components with hooks. No class components.
- **Routing**: `react-router-dom` v7 with `BrowserRouter`. Auth-gated routes
  wrap their element in `<RequireAuth>` (see `src/SapAssistant.Web/src/App.tsx`).
- **Data fetching**: small `apiGet` / `apiPost` helpers in
  `src/SapAssistant.Web/src/lib/api.ts`. Don't introduce React Query / SWR
  unless the feature genuinely needs caching/refetching semantics.
- **Styling**: Tailwind v4 utility classes only. No CSS modules, no styled-components.
- **State**: `useState` / `useReducer` for local, lift to nearest common
  ancestor as needed. No Redux.
- **Tests**: every interactive feature gets a Playwright spec in `tests/e2e/`.

### Tests

- **Backend**: xUnit. New behavior gets a test in
  `tests/SapAssistant.Api.Tests/` using `WebApplicationFactory<Program>` with
  the `ASPNETCORE_ENVIRONMENT=Testing` switch (this disables real OIDC).
- **E2E**: Playwright in `tests/e2e/`. Use the `signIn` helper
  (`tests/e2e/tests/helpers/auth.ts`) to fake a user via `/api/test/signin`.
  Tests run against the API serving the built SPA on `localhost:5050`.

### Commits & PRs

- **Conventional commit prefixes**: `feat`, `fix`, `chore`, `infra`, `docs`,
  `test`, `refactor`. Use scopes: `feat(auth)`, `fix(e2e)`, etc.
- **Co-author trailer** for AI-written commits (per repo owner preference):
  ```
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```
- Keep PRs small and self-contained. Bicep changes go in their own PR
  whenever practical (separate workflow runs and risk profile).
- **Never rewrite git history** on `main`. (Repo-owner rule.)

---

## How to run things

```bash
# Backend + frontend with Aspire (recommended local dev):
dotnet run --project src/SapAssistant.AppHost

# Backend tests:
dotnet test SapAssistant.sln

# Frontend build + type-check:
cd src/SapAssistant.Web && npm run build

# Playwright E2E (builds SPA, copies to wwwroot, spins up dotnet on :5050):
cd tests/e2e && npm run prepare:all && npm test

# Repro production OIDC sign-in locally (verbose auth logs):
pwsh ./scripts/run-local-real-auth.ps1
```

---

## Repository map (quick reference)

| Path | Purpose |
|---|---|
| `src/SapAssistant.Api/Program.cs` | Composition root |
| `src/SapAssistant.Api/Auth/AuthConfig.cs` | OIDC + cookie wiring |
| `src/SapAssistant.Api/Endpoints/*.cs` | Per-feature endpoint maps |
| `src/SapAssistant.Api/Storage/*.cs` | Contest repository (in-memory today, blob later) |
| `src/SapAssistant.Api/Chat/*.cs` | Stub chat service |
| `src/SapAssistant.Web/src/App.tsx` | Routes + RequireAuth |
| `src/SapAssistant.Web/src/pages/*.tsx` | Page components |
| `src/SapAssistant.Web/src/components/*.tsx` | Shared components |
| `src/SapAssistant.Web/src/lib/api.ts` | `apiGet` / `apiPost` |
| `infra/main.bicep` | Azure resources (RG-scoped) |
| `Dockerfile` | Multi-stage Node + .NET SDK → ASP.NET runtime |
| `.github/workflows/build-test.yml` | .NET + Web + Playwright |
| `.github/workflows/infra.yml` | Bicep what-if + deploy |
| `.github/workflows/deploy.yml` | GHCR push + Container App update |
| `tests/e2e/` | Playwright suite + helpers |

---

## When you don't know

- If a question is genuinely ambiguous, **add a TODO comment with the
  question** rather than guess. Don't silently invent behavior.
- If you'd need to change conventions in this file to do the task, **stop
  and call it out** — the human will update conventions explicitly.
- If the task touches Bicep or OAuth wiring, surface the diff to the human
  before committing. These are blast-radius-heavy areas.

Welcome — go build something useful.
