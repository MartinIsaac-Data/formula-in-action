# AppSource Readiness Checklist

Phase 5 tracking. The infra/config/docs shape now exists (untested — see
`docs/deployment.md`); what's left is mostly account-, domain-, and
artwork-specific and can't be done from a repo alone.

## Manifest

- [ ] Regenerate `ADDIN_ID` with `crypto.randomUUID()` (currently a fixed dev GUID)
- [x] Real `SupportUrl` / `LearnMoreUrl` pointing at live pages — now `public/support.html`
- [ ] Real `ProviderName` (currently "Formula in Action" placeholder-ish) once there's a publisher entity
- [ ] `AppDomains` limited to the production host(s) (template already parameterizes `__BASE_URL__`)
- [ ] Icons: real 16/32/64/80/128 PNGs (currently 1×1 placeholders in `public/assets/`)
- [ ] Validate: `pnpm --filter @formula-in-action/excel-addin manifest:validate`
- [ ] Consider the unified (JSON) manifest — the template is already isolated

## Hosting

- [x] Add-in static hosting config — `staticwebapp.config.json` (Azure Static Web Apps), correct `frame-ancestors` for Office web/desktop
- [x] API container hosting config — `infra/api.bicep` (Azure Container Apps) + `render.yaml` (Render alternative), both untested
- [x] Deploy workflows scaffolded — `.github/workflows/deploy-api.yml`, `deploy-addin.yml` (manual trigger until secrets exist)
- [ ] Actually provision the resources and point `AppDomains` / `CORS_ORIGINS` at each other
- [ ] `TRUST_PROXY_HOPS` confirmed correct for the chosen host's ingress hop count (set to `1` for both Container Apps and Render)
- [ ] Rate limiting tuned against real traffic; abuse monitoring / alerting

## Privacy & security

- [x] Privacy statement drafted — `docs/privacy-statement.md` / `public/privacy.html` (fill in `[PUBLISHER]` / `[SUPPORT EMAIL]` / `[DATE]`)
- [x] Support page — `public/support.html` (same placeholders)
- [x] Anonymous usage telemetry is opt-in, off by default, `.strict()` schema rejects unwhitelisted props (`packages/shared-types/src/events.ts`)
- [x] `LOG_FORMULA_BODIES=false` in production (default; also not applicable to telemetry, which never carries formula text)
- [ ] Fill in publisher/contact placeholders; get the statement reviewed
- [ ] Dependency audit (`pnpm audit`), Dependabot/Renovate
- [ ] Pen-test / security review of `/v1/explain` and `/v1/events`

## Store listing

- [ ] Name, short + long description, search keywords
- [ ] Screenshots (1366×768) of each tab
- [ ] Video (optional but recommended)
- [ ] Support + help documentation URLs (page content exists; needs a stable public host first)
- [ ] Pricing / licensing decision

## Validation policy (common failure points)

- [ ] Works in Excel on the web, Windows desktop, and Mac desktop
- [x] Handles no-network gracefully (template degrade, Phase 2/4)
- [ ] No console errors on load (needs a real sideload to check)
- [ ] Task pane usable at minimum width (~320px)
- [x] Keyboard-navigable, screen-reader labels (Phase 4 a11y pass; re-audit after real hosting)
- [ ] First-run experience / GetStarted callout is accurate
