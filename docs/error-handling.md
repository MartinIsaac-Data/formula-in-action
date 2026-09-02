# Error handling (requirement #8)

Every failure case the brief lists, and where it is handled.

| Case | Where | Behaviour |
| --- | --- | --- |
| No cell selected | `excelContext.readSelectedFormula` → `no-selection`; `ItemNotFound` also mapped | Task pane shows "Select a cell to get started." |
| Selected cell has a value, not a formula | `readSelectedFormula` → `no-formula` (formula does not start with `=`) | "The selected cell has a value, not a formula." |
| Multiple cells selected | `readSelectedFormula` → `multiple-cells` (`cellCount > 1`) | "Select a single cell that contains a formula." |
| Formula is invalid | `formula-parser` throws `FormulaParseError` → API `422 unparseable_formula` → pane `errorCopy` | "That formula couldn't be read." No retry button. |
| Workbook / sheet protected | `Excel.run` throws; `describeError` maps `AccessDenied` / `GeneralException` | "Excel would not share the selection — the workbook or sheet may be protected." |
| AI service unavailable | `ClaudeProvider.complete` throws → `explainFormula` catches → `buildTemplateDraft`, `meta.degraded = true` | Full explanation from templates; pane shows an "Offline explanation" banner. |
| Model returns invalid JSON | `explainFormula` re-asks once, then template fallback | Same as above. |
| Formula extremely long | API route pre-check → `400 formula_too_long`; `ExplainRequestSchema.max()` backstop | "That formula is very long (up to ~8,000 characters)." |
| Unsupported Excel functions | `formula-analyzer` marks `unknownFunctions`; `risk-detector` emits `unsupported-function`; prompt tells the model to explain cautiously | Warning in the Issues tab; explanation still produced. |
| API rate limit hit | `@fastify/rate-limit` → `429 rate_limited` (with `retry-after`); `apiClient` retries once then surfaces it | "Too many requests. Give it N seconds." Retry button. |
| API slow / unreachable | `apiClient` 30s timeout → `408 timeout`; connection failure → `network_error` | Distinct messages; retry button. Caller-initiated aborts (selection changed) are swallowed. |
| Rapid selection changes | `useSelectedFormula` debounces reads (250ms); `useExplanation` aborts the in-flight request | At most one request per settled selection. |

## Error envelope

Every API error response is `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
Codes: `invalid_request`, `formula_too_long`, `unparseable_formula`, `rate_limited`,
`internal_error`. The client adds `network_error` and `timeout`.
