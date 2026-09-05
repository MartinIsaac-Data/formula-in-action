import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createProvider, type AiProvider } from '@formula-in-action/explanation-engine';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { corsOrigins, loadEnv, resolvedAiApiKey, resolvedAiModel, type Env } from './env';
import { buildLoggerOptions } from './logger';
import {
  errorSchema,
  explainRequestSchema,
  explanationResultSchema,
  telemetryEventSchema,
} from './openapi';
import type { DevHttpsOptions } from './devCerts';
import { registerRoutes } from './routes/index';
import { API_VERSION } from './version';

declare module 'fastify' {
  interface FastifyInstance {
    aiProvider: AiProvider;
    appConfig: { maxTokens: number; telemetryEnabled: boolean; version: string };
  }
}

export interface BuildAppOptions {
  env?: Env;
  /** Inject a provider (tests, or a non-default privacy mode). */
  provider?: AiProvider;
  /** Dev-only: serve HTTPS with the shared Office dev cert (see devCerts.ts). */
  https?: DevHttpsOptions;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const origins = corsOrigins(env);

  const app = Fastify({
    logger: buildLoggerOptions(env),
    bodyLimit: 64 * 1024,
    // Fastify's trustProxy has no plain "hop count" option — express it as
    // "trust the address at proxy-hop index < N" (0 = the immediate client).
    trustProxy:
      env.TRUST_PROXY_HOPS > 0 ? (_address: string, hop: number) => hop < env.TRUST_PROXY_HOPS : false,
    genReqId: (req) => {
      const header = req.headers['x-request-id'];
      return (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    },
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, allowUnionTypes: true } },
    // Only present the key when set — omit it, not `undefined`, so the
    // no-https path resolves to the exact same Fastify() overload as before.
    ...(options.https ? { https: options.https } : {}),
  });

  const provider =
    options.provider ??
    createProvider({
      privacyMode: env.PRIVACY_MODE,
      cloudProvider: env.AI_PROVIDER,
      model: resolvedAiModel(env),
      apiKey: resolvedAiApiKey(env),
      structuredOutput: env.AI_STRUCTURED_OUTPUT,
      endpoint: env.AI_ENDPOINT,
    });

  app.decorate('aiProvider', provider);
  app.decorate('appConfig', {
    maxTokens: env.AI_MAX_TOKENS,
    telemetryEnabled: env.TELEMETRY_ENABLED,
    version: API_VERSION,
  });

  for (const schema of [
    explainRequestSchema,
    explanationResultSchema,
    telemetryEventSchema,
    errorSchema,
  ]) {
    app.addSchema(schema);
  }

  await app.register(helmet, {
    // Left off, not tightened: @fastify/swagger-ui's /docs page needs its own
    // inline scripts/styles, and this app has no other HTML to protect with a
    // CSP. The other helmet defaults (X-Content-Type-Options, HSTS, etc.) still
    // apply. Revisit with a /docs-scoped CSP if that page is ever removed.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(cors, {
    origin: origins.length > 0 ? origins : false,
    methods: ['GET', 'POST'],
    maxAge: 86400,
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    // @fastify/rate-limit does `throw errorResponseBuilder(...)` — this becomes
    // the `error` our setErrorHandler below receives, so it must look like a
    // FastifyError (flat statusCode/code/message), not our final {error:{...}}
    // envelope, or reply serialization fails against the ApiError schema.
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      code: 'rate_limited',
      message: `Rate limit exceeded. Retry after ${context.after}.`,
    }),
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Formula in Action API',
        version: API_VERSION,
        description: 'Turns an Excel formula into a structured, plain-language explanation.',
      },
      tags: [
        { name: 'explain', description: 'Formula explanation' },
        { name: 'meta', description: 'Health and version' },
        { name: 'telemetry', description: 'Anonymous, opt-in usage events' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'unhandled error');
    }
    const code =
      error.code === 'FST_ERR_VALIDATION'
        ? 'invalid_request'
        : statusCode === 429
          ? 'rate_limited'
          : statusCode >= 500
            ? 'internal_error'
            : 'request_error';
    void reply.status(statusCode).send({
      error: {
        code,
        message: statusCode >= 500 ? 'The server could not process this request.' : error.message,
        ...(error.validation ? { details: error.validation } : {}),
      },
    });
  });

  await registerRoutes(app);
  await app.ready();
  return app;
}
