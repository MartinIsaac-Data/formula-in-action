# Contributing

## Setup

```bash
corepack enable
pnpm install
pnpm test && pnpm typecheck && pnpm lint
```

Node `>= 20`, pnpm `9.x`.

## Layout

- `packages/*` — the framework-agnostic core. **No I/O, no Excel, no framework.**
  Pure functions in, plain data out. This is what makes a web / Sheets / VS Code
  build possible later.
- `apps/api` — the only place secrets and network calls live.
- `apps/excel-addin` — the only Excel-aware code.

## Adding support for an Excel function

1. Add one record to `packages/formula-analyzer/src/functions/registry.ts`.
2. If it introduces a new risk, add a rule to
   `packages/risk-detector/src/rules/index.ts` and a fixture test.
3. Add the formula to `tests/acceptance-matrix.test.ts` if it is a common case.

No engine changes should be needed.

## Adding a risk rule

One object in `RISK_RULES`, pure function of `StructuredFormula`. Add a test that
asserts it both fires and stays silent.

## Conventions

- TypeScript strict; `import type` for type-only imports (enforced).
- Zod schemas in `shared-types` are the single source of truth for the wire
  contract — change them there, never redefine shapes.
- Deterministic core stays deterministic: no `Date.now()`, no randomness, no
  network. Inject clocks (`ExplainOptions.now`).
- Keep the AI optional: every user-facing field must have a template fallback.

## Commits

Conventional-ish subject lines. Run the full check before pushing:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
