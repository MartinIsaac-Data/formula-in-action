# Testing

```bash
pnpm test            # all suites, once
pnpm test:watch
pnpm test:coverage
pnpm typecheck        # per package, via turbo
pnpm lint
```

Tests run from the repo root with Vitest; `vitest.config.ts` aliases the
workspace packages to their `src`, so no build step is needed. React/DOM tests
opt into jsdom with `// @vitest-environment jsdom` at the top of the file.

## Layout

| Suite | Covers |
| --- | --- |
| `packages/formula-parser/src/*.test.ts` | tokenizer + Pratt parser, incl. the six requirement-#17 formulas and the nested vision formula |
| `packages/formula-analyzer/src/analyzer.test.ts` | `StructuredFormula` per formula, lookup/date/condition extraction |
| `packages/risk-detector/src/rules.test.ts` | each rule fires / stays silent; severity ordering |
| `packages/kpi-detector/src/detector.test.ts` | Stock Coverage / Growth Rate / Gross Margin shapes |
| `packages/explanation-engine/src/*.test.ts` | prompt building, template fallback, engine orchestration (mock + failing providers), retry-then-degrade |
| `apps/api/test/*.test.ts` | `POST /v1/explain` happy path, `400` (validation, `formula_too_long`), `422`, `429`, template degrade; `/health`; `/docs/json` |
| `apps/excel-addin/src/**/*.test.ts` | API client (timeout, retry, error envelope), error copy mapping, theme luminance |
| `tests/engine-pipeline.test.ts` | parser → analyzer → risk → kpi, the Phase 1 acceptance suite |
| `tests/acceptance-matrix.test.ts` | **requirement #17 matrix** — the six verification criteria for each initial formula, plus every illustrative-example context |

## What still needs a real Excel

The parts Vitest cannot reach — verify by sideloading (`apps/excel-addin/README.md`):

- `Excel.run` selection reads and the `onSelectionChanged` subscription
- The ribbon button / task-pane manifest wiring
- Fluent UI rendering, light/dark switching with the Office theme
- A live Claude call (set `ANTHROPIC_API_KEY` and watch `meta.degraded` flip to `false`)

## Prompt tuning (manual)

`buildPrompt` output is deterministic and snapshot-friendly, but the *quality* of
the model's JSON is not unit-testable. Tune against the #17 formulas × the three
modes × a few contexts with a real key, checking: valid JSON first try, no Excel
jargon in `simple`, `calculation` is literal arithmetic, `suggestions` stays `[]`
unless warranted.
