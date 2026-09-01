import { z } from 'zod';
import { ExplanationContextSchema, ExplanationModeSchema } from './enums';

/** Formulas longer than this are rejected before analysis (requirement #8). */
export const MAX_FORMULA_LENGTH = 8192;

/**
 * The payload the task pane sends to `POST /v1/explain`.
 *
 * Privacy: only the formula and the metadata below leave Excel — never cell
 * values, never the workbook.
 */
export const ExplainRequestSchema = z.object({
  formula: z.string().trim().min(1).max(MAX_FORMULA_LENGTH),
  cellAddress: z.string().max(64).optional(),
  sheetNames: z.array(z.string().max(128)).max(64).default([]),
  namedRanges: z.array(z.string().max(128)).max(256).default([]),
  mode: ExplanationModeSchema.default('simple'),
  context: ExplanationContextSchema.default('business'),
  locale: z.string().max(16).default('en-US'),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;
export type ExplainRequestInput = z.input<typeof ExplainRequestSchema>;
