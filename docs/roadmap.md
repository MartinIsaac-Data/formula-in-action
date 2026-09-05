# Roadmap

## Stack rationale (short version)

| Layer | Choice | Reason |
| --- | --- | --- |
| Monorepo | pnpm workspaces + Turborepo | native workspaces, per-package task caching |
| Language | TypeScript strict | one language across engine, API, UI (requirement #15) |
| Add-in UI | React + Vite + Fluent UI v9 | smoothest Office dev loop; Fluent gives Office look + light/dark for free |
| Office | Office.js + XML add-in manifest | widest host coverage today (Win / Mac / Web); manifest generated from a template so the unified manifest is a later config change |
| Backend | Node 20 + Fastify | built-in JSON-schema validation + rate-limit; shares the engine packages verbatim (no port to .NET) |
| AI | `AIProvider` interface; Claude (default) or DeepSeek via `AI_PROVIDER` | strong structured-JSON output on Claude, low-cost OpenAI-compatible alternative on DeepSeek; either is swappable behind the same interface |
| Parsing | in-house parser behind `FormulaParserAdapter` | zero runtime deps in the core; swappable |
| Validation | Zod | one definition → runtime validation + static types; also validates AI output |
| Tests | Vitest | shares Vite config story, ESM-native |

## Dependencies by package

- **root (dev):** typescript, turbo, tsup, vitest, @vitest/coverage-v8, eslint, typescript-eslint, @eslint/js, eslint-config-prettier, prettier, @types/node
- **shared-types:** zod
- **formula-parser:** *(none)*
- **formula-analyzer / risk-detector / kpi-detector:** workspace packages only
- **explanation-engine** (Phase 2): @anthropic-ai/sdk, openai (DeepSeek, via its OpenAI-compatible API), zod
- **apps/api** (Phase 2): fastify, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/swagger, @fastify/swagger-ui, pino, zod, dotenv
- **apps/excel-addin** (Phase 3): react, react-dom, @fluentui/react-components, @fluentui/react-icons; dev: vite, @vitejs/plugin-react, vite-plugin-mkcert, office-addin-debugging, office-addin-manifest, office-addin-dev-certs, @types/office-js, @testing-library/react

## Phases

| Phase | Scope | Milestone |
| --- | --- | --- |
| **0 — Foundations** ✅ | monorepo, tooling, CI, shared-types contract | `pnpm test` runs |
| **1 — Deterministic core** ✅ | parser → analyzer → risk-detector → kpi-detector, full test suite | engine explains formula structure with zero AI |
| **2 — Explanation engine + API** ✅ | prompt builder, `AiProvider` interface, `ClaudeProvider` (structured-output with graceful downgrade), Zod response validation + 1 retry, deterministic **template fallback**; Fastify API (Ajv + Zod validation, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/cors`, Swagger UI, pino); Dockerfile + compose | `curl localhost:8787/v1/explain` returns a schema-valid `ExplanationResult` (degraded template when no API key) |
| **3 — Excel task pane MVP** ✅ (code; not yet sideloaded) | XML manifest (templated dev/prod) + `office-addin-*` scripts + HTTPS via `office-addin-dev-certs`; `useSelectedFormula` (Excel.run + onSelectionChanged, handles no-selection/value/multi-cell/error); `useExplanation` (abortable fetch); tabbed UI Overview / Step-by-step / Example / Issues / Improve; `FunctionsTable`; mode + context pickers persisted via `Office.roamingSettings`; copy + regenerate; Office/OS light-dark with manual toggle; degraded-response banner | full workflow in Excel Web + Desktop |
| **4 — Hardening & polish** ◑ (offline parts done) | #17 acceptance matrix as a test (`tests/acceptance-matrix.test.ts`); every #8 error path handled + mapped (`docs/error-handling.md`) with friendly task-pane copy; stronger system prompt + few-shot; `apiClient` timeout + retry; selection debounce; a11y (`role`/`aria-live`/landmarks); `docs/testing.md`, `docs/appsource-checklist.md`, `CONTRIBUTING.md` | demo-ready MVP |
| **5 — AppSource prep** ◑ (config/docs done, account-specific parts open) | Hosting-as-code (`infra/*.bicep`, `render.yaml`, deploy workflows, `staticwebapp.config.json` with correct Office `frame-ancestors`); opt-in anonymous telemetry (`POST /v1/events`, `.strict()`-whitelisted, off by default); `public/privacy.html` + `public/support.html` + `docs/privacy-statement.md` (draft, needs publisher/contact fill-in); `docs/deployment.md`; `docs/appsource-checklist.md` updated | Partner Center submission, once hosted + reviewed |
| **6+ — Feature expansion** | formula history → comparison → KPI surfacing → dependency graph → team knowledge base (introduces DB + auth) → more interfaces (web, browser ext, VS Code) reusing `packages/*` | — |

## MVP scope lock

**In:** select cell → Explain → Simple + Step-by-Step + Formula in Action +
Functions Used + Potential Issues. Three modes, seven contexts, the 26 functions
in requirement #13, the six #17 test formulas.

**Out:** database, accounts/auth, formula comparison, history, learning mode,
dependency graph, team knowledge base, local/enterprise AI (interface stubs only).
