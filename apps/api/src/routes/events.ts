import { TelemetryEventSchema } from '@formula-in-action/shared-types';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Anonymous, opt-in usage telemetry. No formula content is ever accepted here —
 * `TelemetryEventSchema`'s `props` object is `.strict()`, so an unexpected key
 * (someone smuggling formula text) is rejected outright, not silently dropped.
 *
 * Nothing is persisted in the MVP; events are structured-logged only. A future
 * `packages/*` addition can fan this out to a real analytics store.
 */
export const eventsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/v1/events',
    {
      schema: {
        tags: ['telemetry'],
        summary: 'Record one anonymous usage event',
        description:
          'Opt-in only — the task pane must not call this unless the user enabled ' +
          '"share anonymous usage stats". Always responds 202, even when telemetry ' +
          'collection is disabled server-side, so the client never has to branch on it.',
        body: { $ref: 'TelemetryEvent#' },
        response: {
          202: { type: 'object', properties: { status: { type: 'string' } } },
          400: { $ref: 'ApiError#' },
        },
      },
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      if (!app.appConfig.telemetryEnabled) {
        return reply.code(202).send({ status: 'accepted' });
      }

      const parsed = TelemetryEventSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'invalid_request', message: 'Event failed validation.', details: parsed.error.issues },
        });
      }

      request.log.info({ telemetry: parsed.data }, 'telemetry_event');
      return reply.code(202).send({ status: 'accepted' });
    },
  );
};
