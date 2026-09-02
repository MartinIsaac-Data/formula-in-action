import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['meta'],
        summary: 'Liveness probe',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
      config: { rateLimit: false },
    },
    async () => ({ status: 'ok', uptime: Math.round(process.uptime()) }),
  );
};
