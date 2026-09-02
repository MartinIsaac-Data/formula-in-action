export { explainFormula, FormulaParseError } from './engine';
export type { ExplainOptions } from './engine';
export { buildPrompt } from './prompt';
export type { PromptInput } from './prompt';
export { buildTemplateDraft } from './templates';
export { buildFunctionsTable } from './functions-table';
export { AI_DRAFT_JSON_SCHEMA } from './schema';

export type { AiProvider, AiCompletionRequest, ProviderConfig } from './provider';
export { ProviderUnavailableError, ProviderRefusedError } from './provider';
export {
  createProvider,
  ClaudeProvider,
  StubLocalProvider,
  StubEnterpriseProvider,
  MockProvider,
  FailingProvider,
} from './providers/index';
