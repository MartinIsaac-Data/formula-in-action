import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { detectRisks } from '@formula-in-action/risk-detector';
import { AiExplanationDraftSchema } from '@formula-in-action/shared-types';
import { describe, expect, it } from 'vitest';
import { buildTemplateDraft } from './templates';
import type { PromptInput } from './prompt';

function draftFor(formula: string, context: PromptInput['context']) {
  const structured = analyzeFormula(formula);
  return buildTemplateDraft({
    formula,
    structured,
    warnings: detectRisks(structured),
    kpi: null,
    mode: 'simple',
    context,
    locale: 'en-US',
  });
}

describe('buildTemplateDraft', () => {
  it('always produces a schema-valid draft', () => {
    for (const f of [
      '=SUM(A1:A10)',
      '=IF(A1>100,"High","Low")',
      '=IFERROR(A2/B2,0)',
      '=ROUND(AVERAGE(B2:B12),2)',
      '=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")',
    ]) {
      expect(() => AiExplanationDraftSchema.parse(draftFor(f, 'business'))).not.toThrow();
    }
  });

  it('colours the example by context', () => {
    expect(draftFor('=A2/B2', 'supply-chain').illustrativeExample.scenario).toMatch(/warehouse/i);
    expect(draftFor('=A2/B2', 'everyday').illustrativeExample.scenario).toMatch(/bottles/i);
  });

  it('turns a division-risk warning into an IFERROR suggestion', () => {
    const draft = draftFor('=A2/B2', 'business');
    expect(draft.suggestions[0]).toMatchObject({
      id: 'wrap-iferror',
      suggestedFormula: '=IFERROR(A2/B2, 0)',
    });
  });

  it('builds one step per function, deepest first', () => {
    const draft = draftFor('=ROUND(AVERAGE(B2:B12),2)', 'business');
    expect(draft.steps.map((s) => s.formulaPart)).toEqual(['AVERAGE(...)', 'ROUND(...)']);
  });
});
