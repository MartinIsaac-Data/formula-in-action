import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { FormulaParseError } from '@formula-in-action/formula-parser';
import { detectKpi } from '@formula-in-action/kpi-detector';
import { scoreFormula } from '@formula-in-action/quality-engine';
import { detectRisks } from '@formula-in-action/risk-detector';
import {
  AiExplanationDraftSchema,
  ExplanationResultSchema,
  type AiExplanationDraft,
  type ExplainRequest,
  type ExplanationResult,
} from '@formula-in-action/shared-types';
import { buildFunctionsTable } from './functions-table';
import { buildPrompt, type PromptInput } from './prompt';
import type { AiProvider } from './provider';
import { AI_DRAFT_JSON_SCHEMA } from './schema';
import { buildTemplateDraft } from './templates';

export { FormulaParseError };

export interface ExplainOptions {
  provider: AiProvider;
  /** Output-token ceiling for the model. */
  maxTokens?: number;
  /** How many times to re-ask the model after invalid JSON. Default 1. */
  retries?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
  /**
   * Called with the underlying error when the provider fails and the engine
   * falls back to the template — otherwise a degraded response gives no clue
   * why (e.g. a 402 from the provider account, not a bug). Never throws itself.
   */
  onProviderError?: (error: unknown) => void;
}

/**
 * The one entry point: `ExplainRequest` -> validated `ExplanationResult`.
 *
 * Deterministic fields (formula, functions, warnings, detectedKpi) always come
 * from the analysis core. The model only fills the prose fields, and if it
 * fails or returns junk, a template does.
 */
export async function explainFormula(
  request: ExplainRequest,
  options: ExplainOptions,
): Promise<ExplanationResult> {
  const structured = analyzeFormula(request.formula);
  const warnings = detectRisks(structured);
  const kpi = detectKpi(structured);
  const functions = buildFunctionsTable(structured);
  const health = scoreFormula(structured, warnings);

  const promptInput: PromptInput = {
    formula: request.formula,
    structured,
    warnings,
    kpi,
    mode: request.mode,
    context: request.context,
    locale: request.locale,
  };

  const maxTokens = options.maxTokens ?? 3000;
  const retries = options.retries ?? 1;
  const now = options.now ?? ((): Date => new Date());

  let draft: AiExplanationDraft | null = null;
  let degraded = false;
  let model = options.provider.id;

  try {
    draft = await requestDraft(options.provider, promptInput, maxTokens, retries);
  } catch (error) {
    draft = null;
    try {
      options.onProviderError?.(error);
    } catch {
      /* the caller's handler must not take down the request */
    }
  }

  if (!draft) {
    draft = buildTemplateDraft(promptInput);
    degraded = true;
    model = 'template';
  }

  const result: ExplanationResult = {
    formula: request.formula,
    summary: draft.summary,
    simpleExplanation: draft.simpleExplanation,
    technicalExplanation: draft.technicalExplanation,
    steps: draft.steps,
    functions,
    illustrativeExample: draft.illustrativeExample,
    warnings,
    suggestions: draft.suggestions,
    detectedKpi: kpi,
    health,
    meta: {
      mode: request.mode,
      context: request.context,
      model,
      degraded,
      generatedAt: now().toISOString(),
    },
  };

  return ExplanationResultSchema.parse(result);
}

async function requestDraft(
  provider: AiProvider,
  promptInput: PromptInput,
  maxTokens: number,
  retries: number,
): Promise<AiExplanationDraft> {
  const { system, user } = buildPrompt(promptInput);
  let lastError = '';

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const userMessage =
      attempt === 0
        ? user
        : `${user}\n\nYour previous reply was not valid: ${lastError}\nReply with ONLY the corrected JSON object.`;

    const raw = await provider.complete({
      system,
      user: userMessage,
      jsonSchema: AI_DRAFT_JSON_SCHEMA,
      maxTokens,
    });

    const parsed = parseDraft(raw);
    if (parsed.ok) return parsed.value;
    lastError = parsed.error;
  }

  throw new Error(`Model output failed validation after ${retries + 1} attempts: ${lastError}`);
}

type ParseOutcome =
  | { ok: true; value: AiExplanationDraft }
  | { ok: false; error: string };

function parseDraft(raw: string): ParseOutcome {
  const json = extractJsonObject(raw);
  if (json === null) return { ok: false, error: 'response did not contain a JSON object' };

  let candidate: unknown;
  try {
    candidate = JSON.parse(json);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'invalid JSON' };
  }

  const validated = AiExplanationDraftSchema.safeParse(candidate);
  if (!validated.success) {
    return { ok: false, error: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, value: validated.data };
}

/** Pull the outermost `{ ... }` out of a possibly-chatty response. */
function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}
