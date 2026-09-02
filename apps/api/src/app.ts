import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createProvider, type AiProvider } from '@formula-in-action/explanation-engine';
import Fastify, { type FastifyInstance } from 'fastify';
import { corsOrigins, loadEnv, type Env } from './env';
import { buildLoggerOptions } from './logger';
import { errorSchema, explainRequestSchema, explanationResultSchema } from './openapi';
import { registerRoutes } from './routes/index';

declare module 'fastify' {
  interface FastifyInstance {
    aiProvider: AiProvider;
    appConfig: { maxTokens: number };
  }
}

export interface BuildAppOptions {
  env?: Env;
  /** Inject a provider (tests, or a non-default privacy mode). */
  provider?: AiProvider;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();

  const app = Fastify({
    logger: buildLoggerOptions(env),
    bodyLimit: 64 * 1024,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, allowUnionTypes: true } },
  });

  const provider =
    options.provider ??
    createProvider({
      privacyMode: env.PRIVACY_MODE,
      model: env.AI_MODEL,
      apiKey: env.ANTHROPIC_API_KEY,
      structuredOutput: env.AI_STRUCTURED_OUTPUT,
      endpoint: env.AI_ENDPOINT,
    });

  app.decorate('aiProvider', provider);
  app.decorate('appConfig', { maxTokens: env.AI_MAX_TOKENS });

  for (const schema of [explainRequestSchema, explanationResultSchema, errorSchema]) {
    app.addSchema(schema);
  }

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: corsOrigins(env).length > 0 ? corsOrigins(env) : false,
    methods: ['GET', 'POST'],
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: {
        code: 'rate_limited',
        message: `Rate limit exceeded. Retry after ${context.after}.`,
      },
    }),
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Formula in Action API',
        version: '0.1.0',
        description: 'Turns an Excel formula into a structured, plain-language explanation.',
      },
      tags: [{ name: 'explain', description: 'Formula explanation' }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.setErrorHandler((error, request, reply) => {
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
        message:
          statusCode >= 500 ? 'The server could not process this request.' : error.message,
        ...(error.validation ? { details: error.validation } : {}),
      },
    });
  });

  await registerRoutes(app);
  await app.ready();
  return app;
}
