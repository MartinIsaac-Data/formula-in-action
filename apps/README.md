# apps/

Interface + service layer. Empty until Phase 2.

- **`api/`** (Phase 2) — Fastify service. Wraps the deterministic core, adds the
  `explanation-engine` (AI + template fallback), request validation, rate
  limiting, and logging. Holds all secrets. `POST /v1/explain`.
- **`excel-addin/`** (Phase 3) — React + Vite + Fluent UI task pane on Office.js.
  The only Excel-aware code in the repo.

See [`../docs/roadmap.md`](../docs/roadmap.md).
