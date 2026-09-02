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

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

afterEach(() => vi.unstubAllGlobals());

describe('requestExplanation', () => {
  it('returns the parsed result on 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, okResult)));
    const result = await requestExplanation({ formula: '=A1' });
    expect(result.meta.model).toBe('mock');
  });

  it('throws an ApiError carrying the server code on a non-retryable status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(422, { error: { code: 'unparseable_formula', message: 'nope' } })),
    );
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

  it('retries once on 503 and succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: { code: 'unavailable' } }))
      .mockResolvedValueOnce(jsonResponse(200, okResult));
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestExplanation({ formula: '=A1' });
    expect(result.meta.model).toBe('mock');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry with the last error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(429, { error: { code: 'rate_limited', message: 'slow down' } }, { 'retry-after': '2' })),
    );
    const error = (await requestExplanation({ formula: '=A1' }).catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(429);
    expect(error.retryAfterMs).toBe(2000);
  });

  it('propagates a caller cancel as AbortError (not as a timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        if (init.signal?.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'));
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        });
      }),
    );
    const external = new AbortController();
    external.abort();
    await expect(requestExplanation({ formula: '=A1' }, external.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
