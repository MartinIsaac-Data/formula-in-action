# Privacy & Security

## What leaves Excel

Only the `ExplainRequest` payload (`packages/shared-types`):

- the selected formula string
- the cell address (e.g. `Sheet1!C2`)
- the names of sheets the formula references
- the names of named ranges the formula references
- the chosen mode / context / locale

**Never**: cell values, other cells, the workbook, file name, or user identity.

## Where secrets live

- AI provider API keys exist only in `apps/api` environment variables.
- The add-in bundle contains no secrets and calls only our own API.

## API safeguards (requirement #10)

- Request validation against `ExplainRequestSchema` (Zod) before processing.
- Formula length cap (`MAX_FORMULA_LENGTH = 8192`).
- Input sanitisation before prompt construction.
- Per-IP / per-session rate limiting (`@fastify/rate-limit`).
- Structured logging with formula bodies redacted to a hash unless
  `LOG_FORMULA_BODIES=true` (local dev only).

## Privacy modes

`PrivacyModeSchema = 'cloud' | 'local' | 'enterprise'`. The value is threaded
from config into the `AIProvider` factory. The MVP ships `cloud`; `local`
(on-device model) and `enterprise` (customer-hosted endpoint) are wired branches
with stub providers so they can be filled in without architectural change.

## Storage

The MVP does not persist formulas or explanations. User preferences live in
`Office.context.roamingSettings` (per-user, synced by Office). A future "saved
explanations" / "team knowledge base" feature will require explicit opt-in and a
database (PostgreSQL) — see [`roadmap.md`](roadmap.md).
