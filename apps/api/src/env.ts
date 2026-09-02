import { PrivacyModeSchema } from '@formula-in-action/shared-types';
import { z } from 'zod';

const boolish = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(8787),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Local dev only — write raw formula bodies to logs. */
  LOG_FORMULA_BODIES: boolish.default('false'),
  LOG_PRETTY: boolish.default('false'),

  /** Comma-separated allowed origins for CORS; empty = reflect none (same-origin only). */
  CORS_ORIGINS: z.string().default(''),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  PRIVACY_MODE: PrivacyModeSchema.default('cloud'),
  AI_MODEL: z.string().default('claude-sonnet-5'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_STRUCTURED_OUTPUT: boolish.default('true'),
  AI_ENDPOINT: z.string().url().optional(),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof EnvSchema>;

/** Parse and validate `process.env`. Throws (with a readable summary) on boot if invalid. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const summary = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${summary}`);
  }
  const env = parsed.data;
  if (env.PRIVACY_MODE === 'cloud' && !env.ANTHROPIC_API_KEY && env.NODE_ENV === 'production') {
    throw new Error('PRIVACY_MODE=cloud requires ANTHROPIC_API_KEY in production.');
  }
  return env;
}

export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
