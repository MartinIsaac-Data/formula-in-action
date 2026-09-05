import { MockProvider } from '@formula-in-action/explanation-engine';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { loadEnv } from '../src/env';
import { testApp } from './helpers';

describe('GET /health', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('reports ok with a version and uptime', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', version: expect.any(String) });
    expect(res.json().uptime).toBeGreaterThanOrEqual(0);
  });

  it('is exempt from the global rate limit, unlike /v1/explain', async () => {
    const env = loadEnv({ NODE_ENV: 'test', RATE_LIMIT_MAX: '2' } as unknown as NodeJS.ProcessEnv);
    app = await buildApp({ env, provider: new MockProvider('{}', 'mock') });

    for (let i = 0; i < 5; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
    }

    let limited = false;
    for (let i = 0; i < 5; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/explain',
        payload: { formula: '=A1' },
      });
      if (res.statusCode === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });

  it('serves the OpenAPI docs, including the events route', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(res.statusCode).toBe(200);
    expect(res.json().paths).toHaveProperty('/v1/explain');
    expect(res.json().paths).toHaveProperty('/v1/events');
  });
});

describe('GET /version', () => {
  it('matches /health', async () => {
    const app = await testApp();
    const res = await app.inject({ method: 'GET', url: '/version' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
    await app.close();
  });
});
