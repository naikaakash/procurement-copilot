# Procurement Copilot

An enterprise-grade supply-chain control-tower workbench. Designed for buyers and planners to monitor and expedite overdue purchase-order lines, manage supplier delay exposure, and mitigate inventory stock risks across all manufacturing plants.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Auth.js v5 (Microsoft Entra ID) · deployed on Azure Container Apps via GitHub Actions + OIDC federation.

## Deployment

- **Production URL:** https://sapassistant-app.victoriousplant-c4f6558d.eastus2.azurecontainerapps.io
- **Auth:** Microsoft Entra ID (multi-tenant + MSA). Callback: `/api/auth/callback/microsoft-entra-id`.
- **Secrets:** Stored in Azure Key Vault `sapassistantkv01`, mounted into the Container App as env vars via the user-assigned managed identity `sapassistant-uami`.
- **CI/CD:** Push to `main` triggers `.github/workflows/deploy.yml` → builds the image to GHCR → `az deployment group create` rolls infra + image atomically → smoke-tests `/api/health`.
- **Infra:** Single Bicep file at `infra/main.bicep` provisions UAMI, Log Analytics, App Insights, Container Apps Environment, and the Container App itself.

> The Azure resource names (`sap-assistant-rg`, `sapassistant-app`, `sapassistantkv01`, `sapassistant-uami`) still carry the original project codename. Renaming them in place is destructive — they stay as-is for now. The GitHub repo, container image, and product name are all `procurement-copilot`.

### Container image

- Pushed by CI to **`ghcr.io/naikaakash/procurement-copilot`** (tags: `latest` + 7-char commit sha).
- Pulled by the Container App via the Bicep `containerImage` parameter.

### Required env vars (sourced from KV at runtime)

| Env var | KV secret / source |
|---|---|
| `AUTH_SECRET` | KV secret `AUTH-SECRET` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | KV secret `OAuth-Microsoft-ClientId` |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | KV secret `OAuth-Microsoft-ClientSecret` |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | hardcoded `https://login.microsoftonline.com/common/v2.0` |
| `AUTH_URL` | derived from Container App FQDN |
| `AUTH_ALLOWED_EMAILS` | Bicep param `authAllowedEmails` — comma-separated email/UPN allowlist. Empty = open (NOT recommended in prod). |

### Entra app registration

The Entra app (`baacc761-0b8e-4881-832c-630c2365f532`, `signInAudience=AzureADandPersonalMicrosoftAccount`) is configured as a **Native** ("Mobile and desktop") platform — the callback URI is registered under `publicClient.redirectUris` (NOT `web` and NOT `spa`). Auth.js then uses PKCE without a client_secret (`client.token_endpoint_auth_method: "none"`). This is the only combination that works for MSA users on a converged app from a server-rendered Next.js app: SPA fails the token request with AADSTS90023 because Node's fetch can't supply a CORS `Origin` header.

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

For local OAuth, register `http://localhost:3000/api/auth/callback/microsoft-entra-id` under the Entra app's `publicClient.redirectUris` (already done) and supply `AUTH_*` env vars via `.env.local`.

## Architecture & data sourcing

- **Source of truth (today):** 26 relational CSV files under `procurement_data_sample/` — Exceptions, Purchase Order Headers, PO Items, Schedule Lines, Suppliers, Plants, Acknowledgment Status, ASN Shipment Schedules, etc.
- **Service layer:** `src/services/data/csvDataService.ts` reads, joins, and aggregates the CSVs. Decoupled from the UI so a future swap to PostgreSQL only touches this file.
- **API endpoints:**
  - `GET /api/po-overdue/summary` — real-time aggregated metrics for the top dashboard cards
  - `GET /api/po-overdue/worklist` — main workbench table (search + Plant / Supplier / Purchasing Group / Material Group / date / delay filters)
  - `GET /api/po-overdue/detail` — full timeline, supplier profile, safety-stock parameters, recent comms (matched by PO + Item + Schedule Line)
  - `GET /api/filters` — plants, suppliers, purchasing groups for frontend dropdowns

## Development governance

Lightweight per-role guidelines live in `dev_agents/`:

- `dev_agents/project_manager.md` — scope guardrails and out-of-scope leakage checks
- `dev_agents/business_analyst.md` — calculation-formula validation (days overdue, open value, open qty) and PO flow
- `dev_agents/ui_ux_reviewer.md` — visual + interaction standards (readable slates, glassmorphism, drawer dimensions, hover states)
- `dev_agents/tester_qa.md` — user stories and minimum manual test cases

Feature freeze and out-of-scope items are documented in [`docs/project-governance-feature-freeze.md`](docs/project-governance-feature-freeze.md).
