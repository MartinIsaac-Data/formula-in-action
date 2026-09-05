# Deployment

Two independent deployables. **Untested** — written without access to a cloud
account; treat every command here as a first draft to verify, not a proven
recipe.

## 1. API (`apps/api`)

### Option A — Azure Container Apps (primary path, per `docs/roadmap.md`)

```bash
az group create --name formula-in-action --location eastus2
az deployment group create \
  --resource-group formula-in-action \
  --template-file infra/api.bicep \
  --parameters containerImage=ghcr.io/<owner>/<repo>-api:latest \
               anthropicApiKey=<key> \
               corsOrigins=https://<addin-host>
```

Then either run `.github/workflows/deploy-api.yml` manually (`workflow_dispatch`)
with `AZURE_CREDENTIALS` set as a repo secret, or push an image + run
`az containerapp update` yourself. See `infra/README.md`.

### Option B — Render (faster to stand up)

Connect the repo as a Blueprint (`render.yaml` at the repo root) in the Render
dashboard, or `render blueprint launch`. Set `ANTHROPIC_API_KEY` and
`CORS_ORIGINS` in the dashboard after the first deploy — they're marked
`sync: false` so they're never committed.

### Either way

- `TRUST_PROXY_HOPS=1` (already set) — both platforms terminate TLS one hop in
  front of the app, so rate-limiting keys on the real client IP.
- `CORS_ORIGINS` must exactly match the add-in's deployed origin, or the task
  pane's `fetch` calls fail with a CORS error.
- Verify with `curl https://<api-host>/health` and `curl https://<api-host>/docs/json`.

## 2. Task pane (`apps/excel-addin`)

### Azure Static Web Apps

```bash
az deployment group create \
  --resource-group formula-in-action \
  --template-file infra/addin-swa.bicep
az staticwebapp secrets list --name formula-in-action-addin \
  --query "properties.apiKey" -o tsv   # → AZURE_STATIC_WEB_APPS_API_TOKEN secret
```

Then run `.github/workflows/deploy-addin.yml` manually, with repo **variables**
`API_BASE_URL` (the deployed API's URL) and `ADDIN_PROD_URL` (this Static Web
App's URL) set. The build step bakes `API_BASE_URL` into the bundle
(`VITE_API_BASE_URL`) and `ADDIN_PROD_URL` into `manifest/manifest.prod.xml`.

Netlify, Vercel, or Azure Blob+CDN work just as well — any static host that
serves the `dist/` output over HTTPS with the headers in
`staticwebapp.config.json` (translate to that platform's config format) is fine.
The one hard requirement is `frame-ancestors` allowing the Office web/desktop
hosts — **do not** ship a blanket `X-Frame-Options: DENY` or `frame-ancestors
'none'`, or Excel simply won't be able to display the task pane.

### After both are live

1. Tighten `staticwebapp.config.json`'s `connect-src` from `https:` to the
   exact API origin.
2. Regenerate `ADDIN_ID` in `manifest/build-manifest.ts` with
   `crypto.randomUUID()` — the checked-in id is a shared dev placeholder.
3. Replace the placeholder icons (`public/assets/`) and the
   `[PUBLISHER]` / `[SUPPORT EMAIL]` placeholders in `public/privacy.html` and
   `public/support.html`.
4. Validate: `pnpm --filter @formula-in-action/excel-addin manifest:validate`.
5. Sideload the production manifest in Excel and run the full requirement-#17
   matrix by hand once against the live AI provider.

See `docs/appsource-checklist.md` for what's left after that.
