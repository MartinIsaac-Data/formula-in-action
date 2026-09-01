# Formula in Action

> Don't just explain formulas. Make them understandable.

AI-powered Excel Add-in that turns complex formulas into simple natural-language
explanations, step-by-step breakdowns, non-technical real-world examples, risk
detection, and improvement suggestions.

## Status

**Phase 0 + Phase 1 (deterministic core) — code complete, pending first `pnpm test` run.**

> Written on a machine without a Node runtime. Nothing here has been executed
> yet: run `pnpm install && pnpm typecheck && pnpm test` on Node 20+ and treat
> any failure as the next iteration's work.

| Package | Purpose | State |
| --- | --- | --- |
| `@formula-in-action/shared-types` | Zod schemas + types for the API contract | implemented + tests |
| `@formula-in-action/formula-parser` | Excel formula → tokens → AST (swappable adapter) | implemented + tests |
| `@formula-in-action/formula-analyzer` | AST → `StructuredFormula` (functions, refs, constants, ...) | implemented + tests |
| `@formula-in-action/risk-detector` | `StructuredFormula` → `FormulaWarning[]` (rule engine) | implemented + tests |
| `@formula-in-action/kpi-detector` | Pattern-match common business KPIs | implemented + tests |
| `@formula-in-action/explanation-engine` | Structured prompt → validated JSON (+ template fallback) | Phase 2 |
| `apps/api` | Fastify backend, AI provider routing, validation | Phase 2 |
| `apps/excel-addin` | React + Office.js task pane | Phase 3 |

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
[`docs/architecture.md`](docs/architecture.md) and
[`docs/formula-analysis-engine.md`](docs/formula-analysis-engine.md).

```
Excel formula
  -> formula-parser    (tokenize -> AST)
  -> formula-analyzer  (AST -> StructuredFormula)
  -> risk-detector     (rules -> Warning[])
  -> kpi-detector      (patterns -> detectedKpi)
  -> explanation-engine (structured prompt -> validated JSON)   [Phase 2]
  -> Structured result
```

## License

UNLICENSED (private, pre-release).
