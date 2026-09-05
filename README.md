# Formula in Action

> Don't just explain formulas. Make them understandable.

AI-powered Excel Add-in that turns complex formulas into simple natural-language
explanations, step-by-step breakdowns, non-technical real-world examples, risk
detection, and improvement suggestions.

## Status

**MVP (Phases 0-4) code-complete; Phase 5 (AppSource prep) config/docs done — all pending first `pnpm test` run.**

> Written on a machine without a Node runtime. Nothing here has been executed
> yet: run `pnpm install && pnpm typecheck && pnpm test` on Node 20+ and treat
> any failure as the next iteration's work.

| Package | Purpose | State |
| --- | --- | --- |
| `@formula-in-action/shared-types` | Zod schemas + types for the API contract (incl. telemetry events) | implemented + tests |
| `@formula-in-action/formula-parser` | Excel formula → tokens → AST (swappable adapter) | implemented + tests |
| `@formula-in-action/formula-analyzer` | AST → `StructuredFormula` (functions, refs, constants, ...) | implemented + tests |
| `@formula-in-action/risk-detector` | `StructuredFormula` → `FormulaWarning[]` (rule engine) | implemented + tests |
| `@formula-in-action/kpi-detector` | Pattern-match common business KPIs | implemented + tests |
| `@formula-in-action/explanation-engine` | Structured prompt → validated JSON (+ template fallback) | implemented + tests |
| `apps/api` | Fastify backend: AI routing, validation, rate-limit, telemetry, Swagger | implemented + tests |
| `apps/excel-addin` | React 18 + Vite + Fluent UI v9 + Office.js task pane, opt-in telemetry | implemented (unrun) |
| `infra/`, `render.yaml`, deploy workflows | Azure Container Apps + Static Web Apps (+ Render alt.) hosting-as-code | scaffolded, untested |

Phase 5 (AppSource prep) status: hosting configs, privacy statement draft, and
telemetry consent flow exist; provisioning real infra, filling in publisher
placeholders, and the Partner Center submission itself are still open — see
[`docs/appsource-checklist.md`](docs/appsource-checklist.md).

## Requirements

- Node.js `>= 20`
- pnpm `9.x` (`corepack enable` will provide it)

## Getting started

```bash
pnpm install
pnpm test         # run the deterministic-core test suite
pnpm typecheck
pnpm lint
pnpm build
```

## Architecture

The **Formula Analysis Engine** (`packages/*`) is pure TypeScript with no I/O and
no Excel dependency. Excel is interface #1, not the only interface. See
[`docs/architecture.md`](docs/architecture.md),
[`docs/formula-analysis-engine.md`](docs/formula-analysis-engine.md),
[`docs/error-handling.md`](docs/error-handling.md),
[`docs/testing.md`](docs/testing.md),
[`docs/privacy.md`](docs/privacy.md), and
[`docs/deployment.md`](docs/deployment.md).

```
Excel formula
  -> formula-parser     (tokenize -> AST)
  -> formula-analyzer   (AST -> StructuredFormula)
  -> risk-detector      (rules -> FormulaWarning[])
  -> kpi-detector       (patterns -> detectedKpi)
  -> explanation-engine (structured prompt -> AI draft, validated; template on failure)
  -> apps/api           (Fastify: validate, rate-limit, log, Swagger)
  -> ExplanationResult
```

## API quick start

```bash
pnpm --filter @formula-in-action/api dev
curl -s localhost:8787/v1/explain -H 'content-type: application/json' \
  -d '{"formula":"=IFERROR(A2/B2,0)","mode":"formula-in-action","context":"sales"}'
```

Works with no `ANTHROPIC_API_KEY` (returns the deterministic template,
`meta.degraded=true`). See [`apps/api/README.md`](apps/api/README.md).

## License

UNLICENSED (private, pre-release).
