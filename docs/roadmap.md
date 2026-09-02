# Roadmap

## Stack rationale (short version)

| Layer | Choice | Reason |
| --- | --- | --- |
| Monorepo | pnpm workspaces + Turborepo | native workspaces, per-package task caching |
| Language | TypeScript strict | one language across engine, API, UI (requirement #15) |
| Add-in UI | React + Vite + Fluent UI v9 | smoothest Office dev loop; Fluent gives Office look + light/dark for free |
| Office | Office.js + XML add-in manifest | widest host coverage today (Win / Mac / Web); manifest generated from a template so the unified manifest is a later config change |
| Backend | Node 20 + Fastify | built-in JSON-schema validation + rate-limit; shares the engine packages verbatim (no port to .NET) |
| AI | Anthropic Claude behind an `AIProvider` interface | strong structured-JSON output; provider is swappable |
| Parsing | in-house parser behind `FormulaParserAdapter` | zero runtime deps in the core; swappable |
| Validation | Zod | one definition → runtime validation + static types; also validates AI output |
| Tests | Vitest | shares Vite config story, ESM-native |

## Dependencies by package

- **root (dev):** typescript, turbo, tsup, vitest, @vitest/coverage-v8, eslint, typescript-eslint, @eslint/js, eslint-config-prettier, prettier, @types/node
- **shared-types:** zod
- **formula-parser:** *(none)*
- **formula-analyzer / risk-detector / kpi-detector:** workspace packages only
- **explanation-engine** (Phase 2): @anthropic-ai/sdk, zod
- **apps/api** (Phase 2): fastify, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/swagger, @fastify/swagger-ui, pino, zod, dotenv
- **apps/excel-addin** (Phase 3): react, react-dom, @fluentui/react-components, @fluentui/react-icons; dev: vite, @vitejs/plugin-react, vite-plugin-mkcert, office-addin-debugging, office-addin-manifest, office-addin-dev-certs, @types/office-js, @testing-library/react

## Phases

| Phase | Scope | Milestone |
| --- | --- | --- |
| **0 — Foundations** ✅ | monorepo, tooling, CI, shared-types contract | `pnpm test` runs |
| **1 — Deterministic core** ✅ | parser → analyzer → risk-detector → kpi-detector, full test suite | engine explains formula structure with zero AI |
| **2 — Explanation engine + API** ✅ | prompt builder, `AiProvider` interface, `ClaudeProvider` (structured-output with graceful downgrade), Zod response validation + 1 retry, deterministic **template fallback**; Fastify API (Ajv + Zod validation, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/cors`, Swagger UI, pino); Dockerfile + compose | `curl localhost:8787/v1/explain` returns a schema-valid `ExplanationResult` (degraded template when no API key) |
| **3 — Excel task pane MVP** | manifest + sideload + HTTPS dev; selection hook; tabbed UI (Overview / Step-by-Step / Example / Issues / Improve); functions table; mode switcher; context picker; states; copy/regenerate; light/dark | full workflow in Excel Web + Desktop |
| **4 — Hardening & polish** | run the #17 matrix, prompt tuning per mode/context, all #8 error paths, a11y pass, docs, README | demo-ready MVP |
| **5 — AppSource prep** | Azure hosting, Partner Center, validation-policy review, privacy statement + support URL, telemetry opt-in, listing assets | submitted |
| **6+ — Feature expansion** | formula history → comparison → KPI surfacing → dependency graph → team knowledge base (introduces DB + auth) → more interfaces (web, browser ext, VS Code) reusing `packages/*` | — |

## MVP scope lock

**In:** select cell → Explain → Simple + Step-by-Step + Formula in Action +
Functions Used + Potential Issues. Three modes, seven contexts, the 26 functions
in requirement #13, the six #17 test formulas.

**Out:** database, accounts/auth, formula comparison, history, learning mode,
dependency graph, team knowledge base, local/enterprise AI (interface stubs only).
