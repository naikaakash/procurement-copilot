// =============================================================================
// sap-assistant — production infrastructure.
//
// One file on purpose: small project, easy to read top to bottom.
//
// Resources:
//   - Log Analytics workspace (free tier 5GB/day cap)
//   - Application Insights (workspace-based)
//   - User-assigned Managed Identity (UAMI) → used by Container App
//   - Storage Account (StandardLRS) + "uploads" blob container for Excel files
//   - Container Apps Environment (Consumption workload profile, scale-to-zero)
//   - Container App pulling a public image from GHCR
//   - Key Vault RBAC: UAMI gets "Key Vault Secrets User"
//   - Storage RBAC:   UAMI gets "Storage Blob Data Contributor"
//
// The Key Vault itself already exists (sapassistantkv01) and is RBAC-mode; we
// only add the role assignment here. CI/CD updates the Container App image tag
// via `az containerapp update --image ...`.
// =============================================================================

targetScope = 'resourceGroup'

@description('Short app name; used as the base for every resource name.')
param appName string = 'sapassistant'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Name of the existing Key Vault that holds OAuth secrets.')
param keyVaultName string = 'sapassistantkv01'

@description('Fully qualified container image, e.g. ghcr.io/naikaakash/sap-assistant:latest. The first deploy uses a placeholder; CI overrides with --image.')
param containerImage string = 'mcr.microsoft.com/k8se/quickstart:latest'

@description('Daily ingestion cap (GB) for Log Analytics to protect cost.')
param logAnalyticsDailyCapGb int = 1

// -----------------------------------------------------------------------------
// Naming
// -----------------------------------------------------------------------------
var uamiName        = '${appName}-uami'
var lawName         = '${appName}-law'
var appiName        = '${appName}-appi'
var envName         = '${appName}-env'
var appResourceName = '${appName}-app'
// Storage account names must be globally unique, 3-24 chars, lowercase alnum.
// Suffix with a short hash of the RG id so re-deploys to the same RG land on
// the same account.
var storageName     = take(toLower('${appName}st${uniqueString(resourceGroup().id)}'), 24)
var uploadsContainer = 'uploads'

// -----------------------------------------------------------------------------
// User-assigned Managed Identity
// -----------------------------------------------------------------------------
resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: uamiName
  location: location
}

// -----------------------------------------------------------------------------
// Log Analytics + App Insights
// -----------------------------------------------------------------------------
resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: logAnalyticsDailyCapGb }
    features: { enableLogAccessUsingOnlyResourcePermissions: true }
  }
}

resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: appiName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: law.id
  }
}

// -----------------------------------------------------------------------------
// Storage account for Excel uploads.
// StandardLRS, HTTPS-only, OAuth-only (no shared keys for blob access),
// no public blob access. The Container App's UAMI gets Blob Data Contributor.
// -----------------------------------------------------------------------------
resource storage 'Microsoft.Storage/storageAccounts@2024-01-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    publicNetworkAccess: 'Enabled'
    defaultToOAuthAuthentication: true
    accessTier: 'Hot'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2024-01-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
  }
}

resource uploads 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  parent: blobService
  name: uploadsContainer
  properties: {
    publicAccess: 'None'
  }
}

// -----------------------------------------------------------------------------
// Container Apps Environment (Consumption profile, scale to zero)
// -----------------------------------------------------------------------------
resource env 'Microsoft.App/managedEnvironments@2024-10-02-preview' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// -----------------------------------------------------------------------------
// Container App
// Public ingress, HTTPS-only, autoscale 0→3 on HTTP concurrency.
// FrontendBaseUrl is itself; same origin serves SPA + API.
// -----------------------------------------------------------------------------
resource app 'Microsoft.App/containerApps@2024-10-02-preview' = {
  name: appResourceName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uami.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: env.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT',  value: 'Production' }
            { name: 'ASPNETCORE_URLS',         value: 'http://+:8080' }
            { name: 'KeyVault__Name',          value: keyVaultName }
            { name: 'FrontendBaseUrl',         value: '/' }
            { name: 'AZURE_CLIENT_ID',         value: uami.properties.clientId }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appi.properties.ConnectionString }
            { name: 'Storage__AccountName',    value: storage.name }
            { name: 'Storage__ContainerName',  value: uploadsContainer }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: { concurrentRequests: '50' }
            }
          }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Key Vault role: UAMI → Key Vault Secrets User on the existing vault.
// (RoleDefinitionId is constant across all subscriptions.)
// -----------------------------------------------------------------------------
resource kv 'Microsoft.KeyVault/vaults@2024-04-01-preview' existing = {
  name: keyVaultName
}

var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource kvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: kv
  name: guid(kv.id, uami.id, kvSecretsUserRoleId)
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
  }
}

// -----------------------------------------------------------------------------
// Storage role: UAMI → Storage Blob Data Contributor on the new account.
// -----------------------------------------------------------------------------
var blobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource storageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: guid(storage.id, uami.id, blobDataContributorRoleId)
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', blobDataContributorRoleId)
  }
}

// -----------------------------------------------------------------------------
// Outputs (consumed by CI logs + manual smoke testing)
// -----------------------------------------------------------------------------
output containerAppName     string = app.name
output containerAppFqdn     string = app.properties.configuration.ingress.fqdn
output containerAppUrl      string = 'https://${app.properties.configuration.ingress.fqdn}'
output uamiClientId         string = uami.properties.clientId
output uamiPrincipalId      string = uami.properties.principalId
output envName              string = env.name
output appInsightsName      string = appi.name
output storageAccountName   string = storage.name
output uploadsContainerName string = uploadsContainer
