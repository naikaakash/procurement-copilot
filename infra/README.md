# Infrastructure (Bicep)

Everything in this folder describes the **production** Azure footprint of `sap-assistant`. Local development needs none of this — Aspire spins up everything locally.

## Topology

```
Resource Group: sap-assistant-rg (eastus2, lock=CanNotDelete)
├─ sapassistantkv01       Key Vault          (pre-existing — holds OAuth secrets)
├─ sapassistant-uami      User-assigned MI   (Key Vault Secrets User on the vault above)
├─ sapassistant-law       Log Analytics WS   (5GB/day cap; 30-day retention)
├─ sapassistant-appi      Application Insights (workspace-based)
├─ sapassistant-env       Container Apps Env (Consumption profile)
└─ sapassistant-app       Container App      (scale 0→3, public HTTPS ingress)
                          ↳ image: ghcr.io/naikaakash/sap-assistant:latest (public)
                          ↳ pulls secrets from Key Vault via UAMI at runtime
```

## What runs where

- The Container App pulls a **public image from GHCR** — no registry credentials needed.
- The image bundles the React SPA (served as static files from `wwwroot/`) and the ASP.NET API in one process on port 8080.
- At startup the API uses `DefaultAzureCredential` → User-assigned MI to read `OAuth-Microsoft-*` secrets from Key Vault.
- App Insights connection string is injected via the `APPLICATIONINSIGHTS_CONNECTION_STRING` env var.

## First-time deploy (manual)

```powershell
# Sign in to the right subscription
az login
az account set --subscription "1f772bcb-e332-45c3-a059-9af5187a0539"

# What-if (preview the change)
az deployment group what-if `
  --resource-group sap-assistant-rg `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.json

# Deploy
az deployment group create `
  --resource-group sap-assistant-rg `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.json
```

After the first deploy:
1. Note the `containerAppUrl` output (something like `https://sapassistant-app.<region>.azurecontainerapps.io`).
2. Add `<containerAppUrl>/signin-oidc` as a redirect URI on the Entra app `sap-assistant-user-auth` (AppId `baacc761-…`).
3. Push code to `main` — GitHub Actions builds + pushes to GHCR + updates the Container App.

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `build-test.yml` | every PR + push | restore/build/test .NET; build SPA |
| `infra.yml`      | push to `main` touching `infra/**` | `az deployment group create` |
| `deploy.yml`     | push to `main` touching app code  | docker build → push to GHCR → `az containerapp update --image` |

All workflows authenticate to Azure via **OIDC** (no long-lived secrets) using the Entra app `sap-assistant-github-oidc` (AppId `b110bd86-…`).
