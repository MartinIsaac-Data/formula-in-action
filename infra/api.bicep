// Azure Container Apps deployment for apps/api.
//
// Provisions: Log Analytics workspace, a Container Apps environment, and one
// Container App with external HTTPS ingress on port 8787 (matches the API's
// default PORT). The container image is built and pushed by CI
// (.github/workflows/deploy-api.yml) — this template does not build it.
//
// Usage (first deploy):
//   az deployment group create \
//     --resource-group <rg> \
//     --template-file infra/api.bicep \
//     --parameters containerImage=ghcr.io/<owner>/<repo>-api:latest \
//                  anthropicApiKey=<key> \
//                  corsOrigins=https://<your-addin-domain>
//
// For DeepSeek instead of Claude, add:
//                  aiProvider=deepseek deepseekApiKey=<key>
//
// Subsequent deploys just update the image (see the GitHub Actions workflow),
// which is far faster than re-running this template.

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Base name used to derive resource names.')
param namePrefix string = 'formula-in-action'

@description('Full container image reference, e.g. ghcr.io/OWNER/REPO-api:TAG.')
param containerImage string

@description('Optional: registry server if the image is in a private registry (leave empty for public GHCR images).')
param registryServer string = ''
@description('Optional: registry username.')
param registryUsername string = ''
@secure()
@description('Optional: registry password / PAT.')
param registryPassword string = ''

@allowed(['claude', 'deepseek'])
@description('Which vendor backs PRIVACY_MODE=cloud.')
param aiProvider string = 'claude'

@secure()
@description('Anthropic API key. Required when aiProvider=claude and PRIVACY_MODE=cloud.')
param anthropicApiKey string = ''

@secure()
@description('DeepSeek API key. Required when aiProvider=deepseek and PRIVACY_MODE=cloud.')
param deepseekApiKey string = ''

@description('Comma-separated allowed CORS origins for the task pane, e.g. https://addin.example.com')
param corsOrigins string = ''

@description('AI model id. Leave empty for the per-provider default (claude-sonnet-5 / deepseek-chat).')
param aiModel string = ''

@allowed(['cloud', 'local', 'enterprise'])
param privacyMode string = 'cloud'

@minValue(1)
@maxValue(10)
param minReplicas int = 1
@minValue(1)
@maxValue(10)
param maxReplicas int = 3

var logAnalyticsName = '${namePrefix}-logs'
var envName = '${namePrefix}-env'
var appName = '${namePrefix}-api'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8787
        transport: 'auto'
        allowInsecure: false
      }
      secrets: concat(
        anthropicApiKey != '' ? [{ name: 'anthropic-api-key', value: anthropicApiKey }] : [],
        deepseekApiKey != '' ? [{ name: 'deepseek-api-key', value: deepseekApiKey }] : [],
        registryPassword != '' ? [{ name: 'registry-password', value: registryPassword }] : []
      )
      registries: registryServer != '' ? [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: concat(
            [
              { name: 'NODE_ENV', value: 'production' }
              { name: 'HOST', value: '0.0.0.0' }
              { name: 'PORT', value: '8787' }
              { name: 'LOG_LEVEL', value: 'info' }
              { name: 'LOG_PRETTY', value: 'false' }
              { name: 'CORS_ORIGINS', value: corsOrigins }
              // Container Apps' ingress proxy is one hop in front of the app.
              { name: 'TRUST_PROXY_HOPS', value: '1' }
              { name: 'PRIVACY_MODE', value: privacyMode }
              { name: 'AI_PROVIDER', value: aiProvider }
            ],
            aiModel != '' ? [{ name: 'AI_MODEL', value: aiModel }] : [],
            anthropicApiKey != '' ? [{ name: 'ANTHROPIC_API_KEY', secretRef: 'anthropic-api-key' }] : [],
            deepseekApiKey != '' ? [{ name: 'DEEPSEEK_API_KEY', secretRef: 'deepseek-api-key' }] : []
          )
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/health', port: 8787 }
              initialDelaySeconds: 5
              periodSeconds: 15
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

output apiUrl string = 'https://${api.properties.configuration.ingress.fqdn}'
