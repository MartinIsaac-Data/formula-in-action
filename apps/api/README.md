# @formula-in-action/api

Fastify service that wraps the deterministic core + the AI explanation engine.
Holds all secrets; the add-in never talks to a model directly.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/v1/explain` | Body = `ExplainRequest`; returns `ExplanationResult`. |
| `GET` | `/health` | Liveness probe (rate-limit exempt). |
| `GET` | `/docs` | Swagger UI. `GET /docs/json` for the raw OpenAPI spec. |

## Run locally

```bash
cp apps/api/.env.example apps/api/.env   # then set ANTHROPIC_API_KEY (optional)
pnpm --filter @formula-in-action/api dev
curl -s localhost:8787/v1/explain -H 'content-type: application/json' \
  -d '{"formula":"=IFERROR(A2/B2,0)","mode":"formula-in-action","context":"sales"}' | jq
```

Without `ANTHROPIC_API_KEY` the provider is unavailable and every response is the
deterministic template (`meta.degraded = true`) — useful for offline work.

## Configuration

See [`.env.example`](.env.example). Key vars: `ANTHROPIC_API_KEY`, `AI_MODEL`
(default `claude-sonnet-5`), `PRIVACY_MODE` (`cloud` only in the MVP),
`RATE_LIMIT_MAX`, `CORS_ORIGINS`, `LOG_FORMULA_BODIES` (dev only).

## Behaviour

- Request is validated twice: Fastify/Ajv (shape + OpenAPI docs) then Zod
  (`ExplainRequestSchema`, applies defaults). Failures → `400 invalid_request`.
- Formula is sanitised (control chars stripped) before analysis.
- Unparseable formula → `422 unparseable_formula`.
- Provider failure or invalid model JSON → template fallback, still `200`.
- All errors share the envelope `{ "error": { "code", "message", "details"? } }`.

## Docker

```bash
docker compose up --build          # from the repo root
```

The image is built with `pnpm deploy` (self-contained, prod-only deps).
