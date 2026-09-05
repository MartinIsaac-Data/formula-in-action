import type { FastifyInstance } from 'fastify';
import { eventsRoutes } from './events';
import { explainRoutes } from './explain';
import { healthRoutes } from './health';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(explainRoutes);
  await app.register(eventsRoutes);
}
