import { z } from 'zod';
import { ExplanationContextSchema, ExplanationModeSchema } from './enums';

/** Anonymous usage events. Opt-in only; never carries formula content. */
export const TELEMETRY_EVENTS = [
  'pane_opened',
  'explanation_shown',
  'explanation_failed',
  'mode_changed',
  'context_changed',
  'regenerated',
  'suggestion_copied',
] as const;

export const TelemetryEventNameSchema = z.enum(TELEMETRY_EVENTS);
export type TelemetryEventName = z.infer<typeof TelemetryEventNameSchema>;

export const LatencyBucketSchema = z.enum(['fast', 'medium', 'slow', 'very-slow']);
export type LatencyBucket = z.infer<typeof LatencyBucketSchema>;

/**
 * `.strict()` is deliberate — it rejects any property not on this whitelist, so
 * a client bug or a malicious page cannot smuggle formula text through `props`.
 */
export const TelemetryPropsSchema = z
  .object({
    mode: ExplanationModeSchema.optional(),
    context: ExplanationContextSchema.optional(),
    degraded: z.boolean().optional(),
    warningCount: z.number().int().nonnegative().max(100).optional(),
    functionCount: z.number().int().nonnegative().max(100).optional(),
    nestingDepth: z.number().int().nonnegative().max(50).optional(),
    latencyBucket: LatencyBucketSchema.optional(),
    errorCode: z.string().max(64).optional(),
  })
  .strict();
export type TelemetryProps = z.infer<typeof TelemetryPropsSchema>;

export const TelemetryEventSchema = z.object({
  event: TelemetryEventNameSchema,
  /** Random per pane load; not persisted, not identifying. */
  sessionId: z.string().uuid(),
  ts: z.string().datetime(),
  props: TelemetryPropsSchema.default({}),
});
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type TelemetryEventInput = z.input<typeof TelemetryEventSchema>;

export function latencyBucket(ms: number): LatencyBucket {
  if (ms < 1500) return 'fast';
  if (ms < 4000) return 'medium';
  if (ms < 10000) return 'slow';
  return 'very-slow';
}
