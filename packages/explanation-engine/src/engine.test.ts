import { ExplainRequestSchema, ExplanationResultSchema } from '@formula-in-action/shared-types';
import { describe, expect, it, vi } from 'vitest';
import { explainFormula } from './engine';
import { FailingProvider, MockProvider } from './providers/index';

const VALID_DRAFT = JSON.stringify({
  summary: 'Divides A2 by B2 and shows 0 on error.',
  simpleExplanation: 'It divides one cell by another and falls back to 0 if that fails.',
  technicalExplanation: 'IFERROR evaluates A2/B2 and returns 0 when the division errors.',
  steps: [
    { step: 1, formulaPart: 'A2/B2', explanation: 'Divide A2 by B2.' },
    { step: 2, formulaPart: 'IFERROR(...,0)', explanation: 'Return 0 if that errored.' },
  ],
  illustrativeExample: {
    title: 'Formula in Action',
    scenario: 'You sold 100 items across 10 stores.',
    calculation: '100 / 10 = 10',
    result: '10 items per store; 0 if there are no stores.',
  },
  suggestions: [],
});

const req = (overrides: Record<string, unknown> = {}) =>
  ExplainRequestSchema.parse({ formula: '=IFERROR(A2/B2,0)', context: 'sales', ...overrides });

const fixedNow = (): Date => new Date('2026-09-02T00:00:00.000Z');

describe('explainFormula', () => {
  it('returns a schema-valid result on the happy path', async () => {
    const result = await explainFormula(req(), {
      provider: new MockProvider(VALID_DRAFT, 'claude-sonnet-5'),
      now: fixedNow,
    });

    expect(() => ExplanationResultSchema.parse(result)).not.toThrow();
    expect(result.meta).toMatchObject({ degraded: false, model: 'claude-sonnet-5', mode: 'simple' });
    expect(result.simpleExplanation).toContain('divides');
  });

  it('fills deterministic fields from the analysis core, not the model', async () => {
    const result = await explainFormula(req(), {
      provider: new MockProvider(VALID_DRAFT),
      now: fixedNow,
    });
    expect(result.functions).toEqual([
      expect.objectContaining({ name: 'IFERROR', purpose: expect.any(String) }),
    ]);
    // IFERROR wraps the division -> no division-risk warning
    expect(result.warnings.map((w) => w.id)).not.toContain('division-risk');
  });

  it('falls back to the template when the provider throws', async () => {
    const result = await explainFormula(req(), { provider: new FailingProvider(), now: fixedNow });
    expect(result.meta).toMatchObject({ degraded: true, model: 'template' });
    expect(() => ExplanationResultSchema.parse(result)).not.toThrow();
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('retries once on invalid JSON, then falls back', async () => {
    let calls = 0;
    const provider = new MockProvider(() => {
      calls += 1;
      return 'not json at all';
    }, 'flaky');
    const result = await explainFormula(req(), { provider, now: fixedNow });
    expect(calls).toBe(2); // initial + 1 retry
    expect(result.meta.degraded).toBe(true);
  });

  it('recovers JSON wrapped in prose or code fences', async () => {
    const chatty = 'Sure! Here is the JSON:\n```json\n' + VALID_DRAFT + '\n```\nHope that helps.';
    const result = await explainFormula(req(), {
      provider: new MockProvider(chatty),
      now: fixedNow,
    });
    expect(result.meta.degraded).toBe(false);
  });

  it('colours the illustrative example by context on the template path', async () => {
    const result = await explainFormula(req({ context: 'supply-chain' }), {
      provider: new FailingProvider(),
      now: fixedNow,
    });
    expect(result.illustrativeExample.scenario.toLowerCase()).toContain('warehouse');
  });

  it('propagates a parse error for an invalid formula', async () => {
    await expect(
      explainFormula(req({ formula: '=SUM(' }), { provider: new MockProvider(VALID_DRAFT) }),
    ).rejects.toThrow();
  });

  it('reports the underlying provider error via onProviderError when degrading', async () => {
    const boom = new Error('402 Insufficient Balance');
    const onProviderError = vi.fn();
    const result = await explainFormula(req(), {
      provider: new FailingProvider(boom),
      now: fixedNow,
      onProviderError,
    });
    expect(result.meta.degraded).toBe(true);
    expect(onProviderError).toHaveBeenCalledTimes(1);
    expect(onProviderError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not call onProviderError on the happy path', async () => {
    const onProviderError = vi.fn();
    await explainFormula(req(), { provider: new MockProvider(VALID_DRAFT), now: fixedNow, onProviderError });
    expect(onProviderError).not.toHaveBeenCalled();
  });

  it('swallows a throwing onProviderError instead of failing the request', async () => {
    const result = await explainFormula(req(), {
      provider: new FailingProvider(),
      now: fixedNow,
      onProviderError: () => {
        throw new Error('logger is broken');
      },
    });
    expect(result.meta.degraded).toBe(true);
  });
});
