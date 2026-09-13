import type { ExplainRequest, ExplanationResult } from '@formula-in-action/shared-types';
import { describe, expect, it } from 'vitest';
import { ExplainCache } from '../src/lib/explainCache';

const request = (overrides: Partial<ExplainRequest> = {}): ExplainRequest => ({
  formula: '=SUM(A1:A10)',
  sheetNames: [],
  namedRanges: [],
  mode: 'simple',
  context: 'business',
  locale: 'en-US',
  ...overrides,
});

const result = (degraded = false): ExplanationResult =>
  ({ formula: '=SUM(A1:A10)', meta: { degraded } }) as ExplanationResult;

describe('ExplainCache', () => {
  it('returns a stored result for an identical request', () => {
    const cache = new ExplainCache({ maxEntries: 10, ttlMs: 60_000 });
    cache.set(request(), 'model-a', result());
    expect(cache.get(request(), 'model-a')).toEqual(result());
    expect(cache.stats.hits).toBe(1);
  });

  it('treats mode, context, locale and model as part of the identity', () => {
    const cache = new ExplainCache({ maxEntries: 10, ttlMs: 60_000 });
    cache.set(request(), 'model-a', result());

    expect(cache.get(request({ mode: 'technical' }), 'model-a')).toBeUndefined();
    expect(cache.get(request({ context: 'finance' }), 'model-a')).toBeUndefined();
    expect(cache.get(request({ locale: 'fr-FR' }), 'model-a')).toBeUndefined();
    expect(cache.get(request(), 'model-b')).toBeUndefined();
    expect(cache.get(request({ formula: '=SUM(A1:A11)' }), 'model-a')).toBeUndefined();
  });

  it('never caches a degraded result', () => {
    const cache = new ExplainCache({ maxEntries: 10, ttlMs: 60_000 });
    cache.set(request(), 'model-a', result(true));
    expect(cache.get(request(), 'model-a')).toBeUndefined();
  });

  it('expires entries after the ttl', () => {
    let clock = 0;
    const cache = new ExplainCache({ maxEntries: 10, ttlMs: 1_000, now: () => clock });
    cache.set(request(), 'model-a', result());

    clock = 999;
    expect(cache.get(request(), 'model-a')).toBeDefined();
    clock = 1_000;
    expect(cache.get(request(), 'model-a')).toBeUndefined();
  });

  it('evicts the least recently used entry when full', () => {
    const cache = new ExplainCache({ maxEntries: 2, ttlMs: 60_000 });
    cache.set(request({ formula: '=A1' }), 'm', result());
    cache.set(request({ formula: '=A2' }), 'm', result());

    // Touch the oldest so the *next* insert evicts =A2 instead.
    expect(cache.get(request({ formula: '=A1' }), 'm')).toBeDefined();
    cache.set(request({ formula: '=A3' }), 'm', result());

    expect(cache.get(request({ formula: '=A1' }), 'm')).toBeDefined();
    expect(cache.get(request({ formula: '=A2' }), 'm')).toBeUndefined();
    expect(cache.stats.size).toBe(2);
  });

  it('is a no-op when disabled', () => {
    const cache = new ExplainCache({ maxEntries: 0, ttlMs: 60_000 });
    cache.set(request(), 'model-a', result());
    expect(cache.enabled).toBe(false);
    expect(cache.get(request(), 'model-a')).toBeUndefined();
    expect(cache.stats.size).toBe(0);
  });
});
