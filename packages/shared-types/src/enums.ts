import { z } from 'zod';

/** How deep an explanation should go. `formula-in-action` is the signature mode. */
export const ExplanationModeSchema = z.enum(['simple', 'technical', 'formula-in-action']);
export type ExplanationMode = z.infer<typeof ExplanationModeSchema>;

/** Domain used to colour the real-world illustrative example. */
export const ExplanationContextSchema = z.enum([
  'everyday',
  'business',
  'finance',
  'sales',
  'supply-chain',
  'hr',
  'education',
]);
export type ExplanationContext = z.infer<typeof ExplanationContextSchema>;

export const WarningSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type WarningSeverity = z.infer<typeof WarningSeveritySchema>;

export const KpiConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type KpiConfidence = z.infer<typeof KpiConfidenceSchema>;

/** Where AI inference runs. MVP ships `cloud`; the others are wired stubs. */
export const PrivacyModeSchema = z.enum(['cloud', 'local', 'enterprise']);
export type PrivacyMode = z.infer<typeof PrivacyModeSchema>;
