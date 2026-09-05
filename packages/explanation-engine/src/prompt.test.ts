import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { detectKpi } from '@formula-in-action/kpi-detector';
import { detectRisks } from '@formula-in-action/risk-detector';
import { describe, expect, it } from 'vitest';
import { buildPrompt, type PromptInput } from './prompt';

function promptFor(formula: string, overrides: Partial<PromptInput> = {}): { system: string; user: string } {
  const structured = analyzeFormula(formula);
  return buildPrompt({
    formula,
    structured,
    warnings: detectRisks(structured),
    kpi: detectKpi(structured),
    mode: 'simple',
    context: 'business',
    locale: 'en-US',
    ...overrides,
  });
}

describe('buildPrompt', () => {
  it('includes the formula, functions, mode and context', () => {
    const { system, user } = promptFor('=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))', {
      mode: 'technical',
      context: 'finance',
    });
    expect(system).toContain('Formula in Action');
    expect(user).toContain('=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))');
    expect(user).toContain('SUMIFS×1');
    expect(user).toContain('DATE×1');
    expect(user).toMatch(/EXPLANATION MODE: technical/);
    expect(user).toMatch(/finance/);
    expect(user).toContain('whole-column references: C:C, A:A, B:B');
  });

  it('surfaces detected issues and KPI', () => {
    const { user } = promptFor('=ClosingStock/AverageConsumption');
    expect(user).toContain('DETECTED ISSUES');
    expect(user).toContain('Stock Coverage');
  });

  it('omits empty sections', () => {
    const { user } = promptFor('=1+1');
    expect(user).not.toContain('named ranges');
    expect(user).not.toContain('lookups:');
  });

  it('instructs the model to respond in the requested language, but not for the default locale', () => {
    expect(promptFor('=1+1').user).not.toContain('RESPONSE LANGUAGE');
    const { user } = promptFor('=1+1', { locale: 'fr-FR' });
    expect(user).toContain('RESPONSE LANGUAGE');
    expect(user).toContain('French');
  });
});
