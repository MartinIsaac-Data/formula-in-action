# The Formula Analysis Engine

Four pure-TypeScript packages, no I/O, no Excel dependency. Given a formula
string they produce a deterministic, reproducible description that the
explanation engine turns into an AI prompt — and that already answers most of
requirement #3 on its own.

## `@formula-in-action/formula-parser`

Hand-written tokenizer + Pratt parser, exposed behind `FormulaParserAdapter` so
the implementation can be swapped for a third-party grammar without touching
callers.

- `tokenize(source)` — flat token stream. Keeps `A:A` / `1:1` as single ref
  tokens; splits `A1:B2` into `ref : ref`. Normalizes `'Sheet Name'!A1`.
- `parseFormula(formula)` — strips a leading `=`, returns `{ source, ast }`.
- `traverse(ast, visit)`, `collect(ast, predicate)`, `unwrap(node)` — AST helpers.

Operator precedence follows Excel, including the quirks: `-2^2 = 4` (unary minus
binds tighter than `^`), `&` looser than arithmetic, comparisons loosest.

**Known limitations (analysis-only):** the intersection operator (space) and
implicit-intersection `@` are dropped; only `,` / `;` separators (en-US);
structured/table references are captured as opaque tokens; `INDEX(...):INDEX(...)`
style range-of-results is not parsed.

## `@formula-in-action/formula-analyzer`

`analyzeFormula(formula) -> StructuredFormula`:

| Field | What it captures |
| --- | --- |
| `functions` | each function, call count, arg counts, category, purpose, deepest nesting level |
| `unknownFunctions` | functions outside the MVP registry |
| `volatileFunctions` | `TODAY`, `NOW`, `OFFSET`, `INDIRECT`, ... |
| `errorHandlingFunctions` | `IFERROR`, `IFNA`, `ISERROR`, ... |
| `maxNestingDepth`, `nestedIfDepth` | structural complexity |
| `operators`, `has{Arithmetic,Comparison,Concatenation,Division}` | operator usage |
| `references`, `fullColumnReferences`, `fullRowReferences` | cell / range / column / row refs, absoluteness, sheet |
| `sheetReferences`, `namedRanges`, `structuredReferences` | external names |
| `constants` | distinct numbers / strings / booleans |
| `dates` | `DATE(...)` occurrences, resolved to ISO when literal |
| `errorLiterals` | `#DIV/0!` etc. written into the formula |
| `conditions` | tests from `IF` / `IFS` / `AND` / `OR`, criteria from `SUMIFS` / `COUNTIFS` / ... |
| `lookups` | `VLOOKUP` / `XLOOKUP` / `MATCH` / `INDEX` with approximate-match / hard-coded-index / fallback flags |

The **function registry** (`src/functions/registry.ts`) is declarative — one
record per function. Adding a function is a one-file change (requirement #13).

## `@formula-in-action/risk-detector`

`detectRisks(structured) -> FormulaWarning[]`, one `RiskRule` per concern,
results ordered by severity. Current rules:

`division-risk` · `vlookup-approximate-match` · `vlookup-fragile-index` ·
`deep-nested-if` · `full-column-performance` · `hardcoded-value` ·
`volatile-recalculation` · `lookup-missing-error-handling` ·
`unsupported-function`.

Rules are pure functions of `StructuredFormula`; adding one is a one-record
change to `RISK_RULES`.

## `@formula-in-action/kpi-detector`

`detectKpi(structured) -> DetectedKpi | null`. Conservative shape + name
matching for **Stock Coverage**, **Growth Rate %**, **Gross Margin %**. Returns
`null` unless a recognizable shape or a strong pair of names is present.

## Test coverage

- `packages/formula-parser/src/*.test.ts` — tokenizer + parser, incl. all six
  requirement-#17 formulas and the nested vision formula.
- `packages/formula-analyzer/src/analyzer.test.ts` — structured output per formula.
- `packages/risk-detector/src/rules.test.ts` — each rule fires / stays silent.
- `packages/kpi-detector/src/detector.test.ts` — KPI shapes.
- `tests/engine-pipeline.test.ts` — the full pipeline, the Phase 1 acceptance suite.
