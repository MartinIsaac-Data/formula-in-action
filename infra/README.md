# infra/

Infrastructure-as-code for the two deployable pieces. **Untested** — written
without access to an Azure subscription or the `az` CLI; review before running
against a real environment, and expect small fixes on first apply.

| File | Provisions | Deployed by |
| --- | --- | --- |
| `api.bicep` | Log Analytics + Container Apps environment + the API container app | `.github/workflows/deploy-api.yml` (image build/push + update) |
| `addin-swa.bicep` | The Azure Static Web App that serves `apps/excel-addin/dist` | `.github/workflows/deploy-addin.yml` (content deploy) |

See [`../docs/deployment.md`](../docs/deployment.md) for the full walkthrough,
required secrets, and the Render alternative for the API.

## One-time setup

```bash
az login
az group create --name formula-in-action --location eastus2

az deployment group create \
  --resource-group formula-in-action \
  --template-file infra/api.bicep \
  --parameters containerImage=ghcr.io/<owner>/<repo>-api:latest \
               anthropicApiKey=<key> \
               corsOrigins=https://<addin-host>

az deployment group create \
  --resource-group formula-in-action \
  --template-file infra/addin-swa.bicep

az staticwebapp secrets list \
  --name formula-in-action-addin \
  --query "properties.apiKey" -o tsv   # → AZURE_STATIC_WEB_APPS_API_TOKEN secret
```

After the add-in has a real hostname, redeploy the API with `corsOrigins` set
to it, and re-render the manifest (`ADDIN_PROD_URL=https://<addin-host> pnpm
--filter @formula-in-action/excel-addin manifest:prod`).
