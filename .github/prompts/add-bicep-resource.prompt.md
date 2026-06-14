---
mode: agent
description: Add a new Azure resource to infra/main.bicep
---

# Add an Azure resource to the live deployment

⚠️ **High blast radius.** Open the PR but do not merge without human review.

## Inputs you need

- **Resource type** (e.g. Storage account, Azure OpenAI, Service Bus).
- **Why it's needed** (which feature / which code consumes it).
- **Naming**: follow the existing `sapassistant*` prefix pattern.
- **RBAC**: which identity needs which role. The UAMI is the runtime
  identity; the CI OIDC SP `sap-assistant-github-oidc` deploys the bicep.

## Files to touch

1. `infra/main.bicep`:
   - Add the resource with a current API version.
   - Use UAMI for any role assignment — never inline secrets.
   - Add an output if the API needs the endpoint at runtime.
   - Keep `minReplicas: 1` on the Container App until Blob-backed
     DataProtection ships.

2. `infra/main.parameters.json`: add any new parameters.

3. `src/SapAssistant.Api/Program.cs` / config: wire the SDK using
   `DefaultAzureCredential` + the UAMI client ID (`AZURE_CLIENT_ID` env var,
   already set on the Container App).

4. **CI permissions**: if the new resource requires RBAC, the CI SP needs
   `User Access Administrator` scoped to that resource. Currently it has UAA
   only on the Key Vault — note this in the PR description so the human can
   add the grant before merging.

## Verification

```bash
az bicep build --file infra/main.bicep
az deployment group what-if \
  --resource-group sap-assistant-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

Open a PR — the `infra` workflow re-runs `what-if`. After review, merging
triggers the actual deploy.
