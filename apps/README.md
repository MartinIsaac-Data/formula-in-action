# apps/

Interface + service layer.

- **`api/`** ✅ (Phase 2) — Fastify service. Wraps the deterministic core + the
  `explanation-engine` (AI + template fallback), request validation, rate
  limiting, logging, Swagger. Holds all secrets. `POST /v1/explain`. See
  [`api/README.md`](api/README.md).
- **`excel-addin/`** (Phase 3) — React + Vite + Fluent UI task pane on Office.js.
  The only Excel-aware code in the repo.

See [`../docs/roadmap.md`](../docs/roadmap.md).
