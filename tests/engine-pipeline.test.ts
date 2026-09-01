/**
 * End-to-end check of the deterministic core: parser -> analyzer -> risk
 * detector -> KPI detector, for every formula in requirement #17 plus the
 * nested "vision" formula. This is the Phase 1 acceptance suite.
 */
import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { detectKpi } from '@formula-in-action/kpi-detector';
import { detectRisks } from '@formula-in-action/risk-detector';
import { describe, expect, it } from 'vitest';

interface EngineResult {
  functions: string[];
  warningIds: string[];
  kpi: string | null;
}

function runEngine(formula: string): EngineResult {
  const structured = analyzeFormula(formula);
  return {
    functions: structured.functions.map((f) => f.name),
    warningIds: detectRisks(structured).map((w) => w.id),
    kpi: detectKpi(structured)?.name ?? null,
  };
}

describe('engine pipeline — requirement #17 matrix', () => {
  it('Test 1 — =SUM(A1:A10)', () => {
    const r = runEngine('=SUM(A1:A10)');
    expect(r.functions).toEqual(['SUM']);
    expect(r.warningIds).toEqual([]);
    expect(r.kpi).toBeNull();
  });

  it('Test 2 — =IF(A1>100,"High","Low")', () => {
    const r = runEngine('=IF(A1>100,"High","Low")');
    expect(r.functions).toEqual(['IF']);
    expect(r.warningIds).toEqual([]);
  });

  it('Test 3 — =IFERROR(A2/B2,0)', () => {
    const r = runEngine('=IFERROR(A2/B2,0)');
    expect(r.functions).toContain('IFERROR');
    expect(r.warningIds).not.toContain('division-risk');
  });

  it('Test 4 — =SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))', () => {
    const r = runEngine('=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))');
    expect(r.functions.sort()).toEqual(['DATE', 'SUMIFS']);
    expect(r.warningIds).toContain('full-column-performance');
  });

  it('Test 5 — =XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")', () => {
    const r = runEngine('=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")');
    expect(r.functions).toEqual(['XLOOKUP']);
    // XLOOKUP has its own "not found" arg -> no missing-error-handling warning
    expect(r.warningIds).not.toContain('lookup-missing-error-handling');
  });

  it('Test 6 — =ROUND(AVERAGE(B2:B12),2)', () => {
    const r = runEngine('=ROUND(AVERAGE(B2:B12),2)');
    expect(r.functions).toEqual(['AVERAGE', 'ROUND']);
    expect(r.warningIds).toEqual([]);
  });

  it('nested vision formula', () => {
    const r = runEngine(
      '=IFERROR(SUMIFS(SALES!$U:$U,SALES!$G:$G,A2,SALES!$U:$U,">="&DATE(2026,9,1),SALES!$U:$U,"<="&DATE(2026,9,30)),0)',
    );
    expect(r.functions.sort()).toEqual(['DATE', 'IFERROR', 'SUMIFS']);
    expect(r.warningIds).toContain('full-column-performance');
    expect(r.warningIds).not.toContain('division-risk');
  });

  it('KPI — =ClosingStock/AverageConsumption is Stock Coverage', () => {
    expect(runEngine('=ClosingStock/AverageConsumption').kpi).toBe('Stock Coverage');
  });
});
