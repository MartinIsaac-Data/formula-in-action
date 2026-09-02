import type { FastifyServerOptions } from 'fastify';
import type { Env } from './env';

type LoggerOption = FastifyServerOptions['logger'];

/** Build the Fastify/pino logger config from the environment. */
export function buildLoggerOptions(env: Env): LoggerOption {
  if (env.NODE_ENV === 'test' || env.LOG_LEVEL === 'silent') {
    return false;
  }

  // Formula bodies live in the request body, which Fastify does not log by
  // default. This redaction is a guard for any code that logs `req.body`.
  const redact = env.LOG_FORMULA_BODIES ? [] : ['req.body.formula', 'body.formula', '*.formula'];

  if (env.LOG_PRETTY) {
    return {
      level: env.LOG_LEVEL,
      redact,
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    };
  }

  return { level: env.LOG_LEVEL, redact };
}
