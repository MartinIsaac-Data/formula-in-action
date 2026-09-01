import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { describe, expect, it } from 'vitest';
import { detectKpi } from './detector';

const kpi = (formula: string): string | null => detectKpi(analyzeFormula(formula))?.name ?? null;

describe('detectKpi', () => {
  it('recognizes Stock Coverage from names', () => {
    expect(kpi('=ClosingStock/AverageConsumption')).toBe('Stock Coverage');
    expect(kpi('=Inventory/MonthlyDemand')).toBe('Stock Coverage');
  });

  it('recognizes Growth Rate from the (new-old)/old shape', () => {
    expect(kpi('=(ThisYear-LastYear)/LastYear')).toBe('Growth Rate %');
    expect(kpi('=NewValue/OldValue-1')).toBe('Growth Rate %');
  });

  it('recognizes Gross Margin from the (revenue-cost)/revenue shape', () => {
    expect(kpi('=(Revenue-Cost)/Revenue')).toBe('Gross Margin %');
  });

  it('gains confidence when names reinforce the shape', () => {
    expect(detectKpi(analyzeFormula('=(Revenue-COGS)/Revenue'))?.confidence).toBe('high');
  });

  it('returns null when nothing recognizable is present', () => {
    expect(kpi('=SUM(A1:A10)')).toBeNull();
    expect(kpi('=A1/B1')).toBeNull();
  });
});
