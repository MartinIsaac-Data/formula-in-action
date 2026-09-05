import type { FastifyPluginAsync } from 'fastify';
import { API_VERSION } from '../version';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  const meta = {
    schema: {
      tags: ['meta'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
    config: { rateLimit: false },
  };

  app.get('/health', { ...meta, schema: { ...meta.schema, summary: 'Liveness probe' } }, async () => ({
    status: 'ok',
    version: API_VERSION,
    uptime: Math.round(process.uptime()),
  }));

  app.get('/version', { ...meta, schema: { ...meta.schema, summary: 'Service version' } }, async () => ({
    status: 'ok',
    version: API_VERSION,
    uptime: Math.round(process.uptime()),
  }));
};
