# AI Explanation Engine (Phase 2 — design notes)

Not yet implemented. Recorded here so Phase 2 starts from a fixed contract.

## Flow

```
StructuredFormula + FormulaWarning[] + DetectedKpi? + mode + context
        -> buildPrompt()            deterministic, no model call
        -> AIProvider.complete()    forces JSON output
        -> AiExplanationDraftSchema.parse()   (Zod; reject + retry once)
        -> merge with deterministic fields
        -> ExplanationResultSchema.parse()
```

## `AIProvider` interface

```ts
interface AIProvider {
  readonly id: string;                 // e.g. "claude-sonnet-5"
  complete(input: { system: string; user: string; schema: JSONSchema }):
    Promise<unknown>;                  // parsed JSON, unvalidated
}
```

Implementations: `ClaudeProvider` (MVP), `StubLocalProvider`,
`StubEnterpriseProvider`, `MockProvider` (tests). Selected by `PrivacyMode`.

## Prompt principles

- The model receives the **StructuredFormula**, not just the raw string.
- The model produces only `AiExplanationDraft` (summary, simple/technical
  explanation, steps, illustrative example, suggestions). Deterministic fields
  (`formula`, `functions`, `warnings`, `detectedKpi`, `meta`) are filled by the
  engine.
- `context` selects the illustrative-example domain (requirement #5).
- `mode` selects which explanation field the UI leads with; all are still
  generated so switching modes is instant and free.

## Degradation (requirement #8)

If the provider call fails or the draft fails validation twice, the engine
returns a **template-built** `ExplanationResult` with `meta.degraded = true`:
formula + functions table + warnings from the deterministic core, plus a
templated step outline and a generic illustrative example.
