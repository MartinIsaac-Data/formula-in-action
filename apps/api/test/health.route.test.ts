import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { testApp } from './helpers';

describe('GET /health', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('reports ok', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('serves the OpenAPI docs', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(res.statusCode).toBe(200);
    expect(res.json().paths).toHaveProperty('/v1/explain');
  });
});
