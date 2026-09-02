# AI Explanation Engine (`@formula-in-action/explanation-engine`)

Implemented in Phase 2.

## Flow

```
ExplainRequest
  -> analyzeFormula()      -> StructuredFormula      (deterministic)
  -> detectRisks()         -> FormulaWarning[]       (deterministic)
  -> detectKpi()           -> DetectedKpi | null     (deterministic)
  -> buildFunctionsTable() -> ExplanationFunction[]  (deterministic, from the registry)
  -> buildPrompt()         -> { system, user }       (deterministic; embeds the analysis)
  -> AiProvider.complete() -> raw text
  -> parse + AiExplanationDraftSchema.safeParse       (retry once with the error on failure)
  -> merge draft (prose) + deterministic fields
  -> ExplanationResultSchema.parse()
```

If the provider throws or the draft never validates, `buildTemplateDraft()`
produces the prose instead and `meta.degraded = true`, `meta.model = "template"`.

## `AiProvider`

```ts
interface AiProvider {
  readonly id: string; // recorded in meta.model
  complete(req: {
    system: string;
    user: string;
    jsonSchema: Record<string, unknown>;
    maxTokens: number;
  }): Promise<string>; // raw assistant text, expected to be one JSON object
}
```

Implementations (`createProvider(config)` picks by `PrivacyMode`):

| id | class | notes |
| --- | --- | --- |
| `<model>` | `ClaudeProvider` | `cloud`. `@anthropic-ai/sdk`, `output_config.effort: "low"`, tries `output_config.format` (json_schema) and retries once without it on `BadRequestError`. Missing key → `ProviderUnavailableError` on `complete()` (not at construction), so the engine degrades. |
| `local-stub` | `StubLocalProvider` | `local`. Always throws. |
| `enterprise-stub` | `StubEnterpriseProvider` | `enterprise`. Always throws. |
| `mock` / `failing` | `MockProvider` / `FailingProvider` | tests. |

## Prompt principles

- The model receives the **StructuredFormula** rendered as a fact sheet, not just
  the raw string. It is told to use exactly the functions listed and not to
  contradict detected references/constants/conditions.
- The model returns only `AiExplanationDraft` (summary, simple/technical
  explanation, steps, illustrative example, suggestions). `formula`, `functions`,
  `warnings`, `detectedKpi`, `meta` are filled by the engine.
- `context` picks the illustrative-example domain (requirement #5); `mode` sets
  which field the pane leads with — all are generated so switching is instant.

## Known Phase-2 caveats

- `output_config.format` shape is best-effort (SDK/model drift). Set
  `AI_STRUCTURED_OUTPUT=false` to rely on prompt + Zod validation only.
- `@anthropic-ai/sdk` version in `package.json` is a guess — `pnpm install` may
  resolve a newer line; bump if resolution complains.
- Template prose is correct but plain — it is a safety net, not the product.
