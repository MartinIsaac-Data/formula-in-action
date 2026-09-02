# AppSource Readiness Checklist

Tracking for a future Microsoft AppSource submission. **Not started** — this is a
Phase 5 concern; listed now so nothing is a surprise.

## Manifest

- [ ] Regenerate `ADDIN_ID` with `crypto.randomUUID()` (currently a fixed dev GUID)
- [ ] Real `ProviderName`, `SupportUrl`, `LearnMoreUrl` pointing at live pages
- [ ] `AppDomains` limited to the production host(s)
- [ ] Icons: real 16/32/64/80/128 PNGs (currently 1×1 placeholders)
- [ ] Validate: `pnpm --filter @formula-in-action/excel-addin manifest:validate`
- [ ] Consider the unified (JSON) manifest — the template is already isolated

## Hosting

- [ ] Add-in static bundle on HTTPS with a stable domain (Azure Static Web Apps / Blob+CDN)
- [ ] API on HTTPS (Azure Container Apps) with the Anthropic key in a secret store
- [ ] `CORS_ORIGINS` set to the add-in origin only
- [ ] Rate limiting tuned; abuse monitoring

## Privacy & security

- [ ] Public privacy statement covering exactly what leaves Excel (see `privacy.md`)
- [ ] Support URL with a real contact path
- [ ] `LOG_FORMULA_BODIES=false` in production (default)
- [ ] Dependency audit (`pnpm audit`), Dependabot/renovate
- [ ] Pen-test / security review of `/v1/explain`

## Store listing

- [ ] Name, short + long description, search keywords
- [ ] Screenshots (1366×768) of each tab
- [ ] Video (optional but recommended)
- [ ] Support + help documentation URLs
- [ ] Pricing / licensing decision

## Validation policy (common failure points)

- [ ] Works in Excel on the web, Windows desktop, and Mac desktop
- [ ] Handles no-network gracefully (already: template degrade)
- [ ] No console errors on load
- [ ] Task pane usable at minimum width (~320px)
- [ ] Keyboard-navigable, screen-reader labels (Phase 4 a11y pass done; re-audit)
- [ ] First-run experience / GetStarted callout is accurate
