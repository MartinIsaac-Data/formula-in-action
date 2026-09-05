// Azure Static Web App to host apps/excel-addin's built output (dist/).
//
// This only provisions the resource — content is deployed by CI
// (.github/workflows/deploy-addin.yml) via the Azure/static-web-apps-deploy
// action, which needs this resource's deployment token as a GitHub secret:
//
//   az staticwebapp secrets list --name <name> --query "properties.apiKey" -o tsv
//
// Usage:
//   az deployment group create \
//     --resource-group <rg> \
//     --template-file infra/addin-swa.bicep

@description('Azure region. Static Web Apps is only available in a subset of regions.')
@allowed(['westus2', 'centralus', 'eastus2', 'westeurope', 'eastasia'])
param location string = 'eastus2'

param name string = 'formula-in-action-addin'

@allowed(['Free', 'Standard'])
param sku string = 'Free'

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: { name: sku, tier: sku }
  properties: {
    // Deploying via the GitHub Action, not SWA's own GitHub integration, so no
    // repositoryUrl/branch/buildProperties are set here.
    stagingEnvironmentPolicy: 'Disabled'
  }
}

output defaultHostname string = 'https://${swa.properties.defaultHostname}'
