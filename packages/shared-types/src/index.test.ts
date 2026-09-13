import { describe, expect, it } from 'vitest';
import { ExplainRequestSchema, ExplanationResultSchema } from './index';

describe('ExplainRequestSchema', () => {
  it('applies defaults for optional fields', () => {
    const parsed = ExplainRequestSchema.parse({ formula: '=A1+B1' });
    expect(parsed).toMatchObject({
      formula: '=A1+B1',
      mode: 'simple',
      context: 'business',
      locale: 'en-US',
      sheetNames: [],
      namedRanges: [],
    });
  });

  it('trims the formula and rejects an empty one', () => {
    expect(ExplainRequestSchema.parse({ formula: '  =A1  ' }).formula).toBe('=A1');
    expect(() => ExplainRequestSchema.parse({ formula: '   ' })).toThrow();
  });

  it('rejects an over-long formula', () => {
    expect(() => ExplainRequestSchema.parse({ formula: `=${'A1+'.repeat(4000)}A1` })).toThrow();
  });

  it('rejects an unknown mode', () => {
    expect(() => ExplainRequestSchema.parse({ formula: '=A1', mode: 'poetic' })).toThrow();
  });
});

describe('ExplanationResultSchema', () => {
  it('round-trips a complete result', () => {
    const result = {
      formula: '=IFERROR(A2/B2,0)',
      summary: 's',
      simpleExplanation: 'se',
      technicalExplanation: 'te',
      steps: [{ step: 1, formulaPart: 'A2/B2', explanation: 'divide' }],
      functions: [{ name: 'IFERROR', purpose: 'handles errors' }],
      illustrativeExample: { title: 't', scenario: 's', calculation: 'c', result: 'r' },
      warnings: [],
      suggestions: [],
      health: {
        score: 100,
        band: 'excellent' as const,
        dimensions: {
          reliability: { score: 100, penalties: [] },
          readability: { score: 100, penalties: [] },
          performance: { score: 100, penalties: [] },
          maintainability: { score: 100, penalties: [] },
        },
      },
      meta: {
        mode: 'simple' as const,
        context: 'business' as const,
        model: 'template',
        degraded: true,
        generatedAt: new Date().toISOString(),
      },
    };
    const parsed = ExplanationResultSchema.parse(result);
    expect(parsed.detectedKpi).toBeNull();
  });
});
