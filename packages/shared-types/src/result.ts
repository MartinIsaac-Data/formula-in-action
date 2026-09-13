import { z } from 'zod';
import {
  ExplanationContextSchema,
  ExplanationModeSchema,
  KpiConfidenceSchema,
  WarningSeveritySchema,
} from './enums';

export const ExplanationStepSchema = z.object({
  step: z.number().int().positive(),
  formulaPart: z.string(),
  explanation: z.string(),
});
export type ExplanationStep = z.infer<typeof ExplanationStepSchema>;

export const ExplanationFunctionSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  /** Longer explanation, revealed when the user expands the function row. */
  detail: z.string().optional(),
});
export type ExplanationFunction = z.infer<typeof ExplanationFunctionSchema>;

/** The signature "Formula in Action" output. */
export const IllustrativeExampleSchema = z.object({
  title: z.string(),
  scenario: z.string(),
  calculation: z.string(),
  result: z.string(),
});
export type IllustrativeExample = z.infer<typeof IllustrativeExampleSchema>;

export const FormulaWarningSchema = z.object({
  id: z.string(),
  severity: WarningSeveritySchema,
  title: z.string(),
  message: z.string(),
  formulaPart: z.string().optional(),
});
export type FormulaWarning = z.infer<typeof FormulaWarningSchema>;

export const FormulaSuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  suggestedFormula: z.string().optional(),
});
export type FormulaSuggestion = z.infer<typeof FormulaSuggestionSchema>;

/**
 * One reason a health dimension lost points. `id` is stable and meant to be
 * localized by the UI; `label` is the English fallback, needed because the API
 * and the add-in deploy independently and may briefly disagree on known ids.
 */
export const HealthPenaltySchema = z.object({
  id: z.string(),
  label: z.string(),
  points: z.number().int().positive(),
});
export type HealthPenalty = z.infer<typeof HealthPenaltySchema>;

export const HealthDimensionSchema = z.object({
  score: z.number().int().min(0).max(100),
  penalties: z.array(HealthPenaltySchema),
});
export type HealthDimension = z.infer<typeof HealthDimensionSchema>;

/** Deterministic 0-100 verdict on the formula. Never AI-generated. */
export const FormulaHealthSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: z.enum(['excellent', 'good', 'fair', 'poor']),
  dimensions: z.object({
    reliability: HealthDimensionSchema,
    readability: HealthDimensionSchema,
    performance: HealthDimensionSchema,
    maintainability: HealthDimensionSchema,
  }),
});
export type FormulaHealth = z.infer<typeof FormulaHealthSchema>;
export type HealthDimensionName = keyof FormulaHealth['dimensions'];

export const DetectedKpiSchema = z.object({
  name: z.string(),
  confidence: KpiConfidenceSchema,
  rationale: z.string(),
});
export type DetectedKpi = z.infer<typeof DetectedKpiSchema>;

export const ExplanationMetaSchema = z.object({
  mode: ExplanationModeSchema,
  context: ExplanationContextSchema,
  /** Model id, or `"template"` when the deterministic fallback produced this. */
  model: z.string(),
  /** True when the AI call failed and this result came from templates. */
  degraded: z.boolean(),
  generatedAt: z.string().datetime(),
});
export type ExplanationMeta = z.infer<typeof ExplanationMetaSchema>;

/** The validated response of `POST /v1/explain`. */
export const ExplanationResultSchema = z.object({
  formula: z.string(),
  summary: z.string(),
  simpleExplanation: z.string(),
  technicalExplanation: z.string(),
  steps: z.array(ExplanationStepSchema),
  functions: z.array(ExplanationFunctionSchema),
  illustrativeExample: IllustrativeExampleSchema,
  warnings: z.array(FormulaWarningSchema),
  suggestions: z.array(FormulaSuggestionSchema),
  detectedKpi: DetectedKpiSchema.nullable().default(null),
  health: FormulaHealthSchema,
  meta: ExplanationMetaSchema,
});
export type ExplanationResult = z.infer<typeof ExplanationResultSchema>;

/**
 * The subset of the result the AI model is asked to produce. Deterministic
 * fields (`formula`, `functions`, `warnings`, `detectedKpi`, `meta`) are filled
 * in by the engine, not the model.
 */
export const AiExplanationDraftSchema = z.object({
  summary: z.string().min(1),
  simpleExplanation: z.string().min(1),
  technicalExplanation: z.string().min(1),
  steps: z.array(ExplanationStepSchema).min(1),
  illustrativeExample: IllustrativeExampleSchema,
  suggestions: z.array(FormulaSuggestionSchema).default([]),
});
export type AiExplanationDraft = z.infer<typeof AiExplanationDraftSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
