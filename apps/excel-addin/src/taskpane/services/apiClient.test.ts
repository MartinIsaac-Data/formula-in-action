import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, requestExplanation } from './apiClient';

const okResult = {
  formula: '=A1',
  summary: 's',
  simpleExplanation: 'se',
  technicalExplanation: 'te',
  steps: [],
  functions: [],
  illustrativeExample: { title: 't', scenario: 's', calculation: 'c', result: 'r' },
  warnings: [],
  suggestions: [],
  detectedKpi: null,
  meta: { mode: 'simple', context: 'business', model: 'mock', degraded: false, generatedAt: '' },
};

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('requestExplanation', () => {
  it('returns the parsed result on 200', async () => {
    mockFetch(200, okResult);
    const result = await requestExplanation({ formula: '=A1' });
    expect(result.meta.model).toBe('mock');
  });

  it('throws an ApiError carrying the server code on non-2xx', async () => {
    mockFetch(422, { error: { code: 'unparseable_formula', message: 'nope' } });
    await expect(requestExplanation({ formula: '=SUM(' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'unparseable_formula',
    });
  });

  it('wraps a network failure as a network_error ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const error = await requestExplanation({ formula: '=A1' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('network_error');
  });
});
