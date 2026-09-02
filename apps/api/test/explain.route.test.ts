import { FailingProvider, MockProvider } from '@formula-in-action/explanation-engine';
import { ExplanationResultSchema } from '@formula-in-action/shared-types';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testApp, VALID_DRAFT } from './helpers';

describe('POST /v1/explain', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('returns a schema-valid explanation on the happy path', async () => {
    app = await testApp(new MockProvider(VALID_DRAFT, 'mock-model'));
    const res = await app.inject({
      method: 'POST',
      url: '/v1/explain',
      payload: { formula: '=IFERROR(A2/B2,0)', mode: 'simple', context: 'sales' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(() => ExplanationResultSchema.parse(body)).not.toThrow();
    expect(body.meta).toMatchObject({ degraded: false, model: 'mock-model' });
    expect(body.functions[0].name).toBe('IFERROR');
  });

  it('applies defaults for omitted mode/context', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'POST', url: '/v1/explain', payload: { formula: '=SUM(A1:A10)' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().meta).toMatchObject({ mode: 'simple', context: 'business' });
  });

  it('rejects a missing formula with 400', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'POST', url: '/v1/explain', payload: { mode: 'simple' } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('invalid_request');
  });

  it('rejects an unknown mode with 400', async () => {
    app = await testApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/explain',
      payload: { formula: '=A1', mode: 'poetic' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 formula_too_long for an oversized formula', async () => {
    app = await testApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/explain',
      payload: { formula: `=${'A1+'.repeat(4000)}A1` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('formula_too_long');
  });

  it('returns 422 for an unparseable formula', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'POST', url: '/v1/explain', payload: { formula: '=SUM(' } });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('unparseable_formula');
  });

  it('degrades to a template when the provider fails, still 200', async () => {
    app = await testApp(new FailingProvider());
    const res = await app.inject({
      method: 'POST',
      url: '/v1/explain',
      payload: { formula: '=IFERROR(A2/B2,0)', context: 'supply-chain' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().meta.degraded).toBe(true);
  });

  it('rate-limits after the configured number of requests', async () => {
    app = await testApp();
    const env = { RATE_LIMIT_MAX: 30 };
    let limited = false;
    for (let i = 0; i < env.RATE_LIMIT_MAX + 2; i += 1) {
      const res = await app.inject({ method: 'POST', url: '/v1/explain', payload: { formula: '=A1+A2' } });
      if (res.statusCode === 429) {
        limited = true;
        expect(res.json().error.code).toBe('rate_limited');
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
