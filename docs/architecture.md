# Architecture

## Principle

The **Formula Analysis Engine is the product**. Excel is the first interface, not
the only one. Everything Excel-specific lives in `apps/excel-addin`; everything
reusable lives in framework-agnostic packages that could later power a web app, a
browser extension, a VS Code extension, a REST API, or a Google Sheets add-on
with no changes.

## Layers

```
INTERFACE          apps/excel-addin      React + Office.js. Knows Excel only.
   | FormulaContext (formula + cell address + sheet names + named ranges)
API                apps/api              Fastify. Auth, rate limit, validation,
   |                                     provider routing, response validation,
   |                                     logging. Holds all secrets.
DETERMINISTIC CORE packages/formula-parser     tokenize -> AST (swappable)
   |               packages/formula-analyzer   AST -> StructuredFormula
   |               packages/risk-detector      rules -> Warning[]
   |               packages/kpi-detector       patterns -> detectedKpi
EXPLANATION        packages/explanation-engine prompt builder + AIProvider
   |                                           interface + Zod validation +
   |                                           deterministic template fallback
RESULT             ExplanationResult (validated) -> task pane
```

## Why deterministic-first

- **Accuracy** — function detection, reference extraction, and risk rules are
  100% reproducible and unit-tested. The LLM never guesses what functions exist.
- **Cost & latency** — trivial formulas can shrink or skip the AI call.
- **Graceful degradation** — if the AI service is down, the user still gets the
  formula, functions table, step outline, and warnings from templates.
- **Prompt quality** — the model receives structured context, not a raw string.

## Privacy

- The task pane sends only the selected formula plus minimal metadata (cell
  address, referenced sheet names, named-range names). Never cell values, never
  the workbook.
- A `PrivacyMode` enum (`cloud` | `local` | `enterprise`) is threaded from config
  into the `AIProvider` factory. MVP ships `cloud`; the others are wired stubs.
- API keys live only in `apps/api` env vars. The add-in holds no secrets.
- Formulas are not persisted in the MVP. Logs redact formula bodies (hash only)
  unless `LOG_FORMULA_BODIES=true`.

## The contract

`packages/shared-types` exports Zod schemas. Both apps import them. The API
validates the inbound request against `ExplainRequestSchema` and the AI output
against `ExplanationResultSchema` before anything reaches the UI.

## Repository layout

See [`../README.md`](../README.md). Monorepo: pnpm workspaces + Turborepo.
Packages build with `tsup` (esbuild); typecheck with `tsc --noEmit`; test with
Vitest from the repo root (aliases in `vitest.config.ts` resolve workspace
packages to their `src` so tests need no build step).
