import { describe, expect, it } from 'vitest';
import { analyzeFormula } from './analyzer';

const fnNames = (formula: string): string[] => analyzeFormula(formula).functions.map((f) => f.name);

describe('analyzeFormula — the six initial test formulas (requirement #17)', () => {
  it('Test 1 — =SUM(A1:A10)', () => {
    const s = analyzeFormula('=SUM(A1:A10)');
    expect(s.functions).toEqual([
      expect.objectContaining({ name: 'SUM', count: 1, known: true, category: 'aggregation' }),
    ]);
    expect(s.references).toEqual([expect.objectContaining({ raw: 'A1:A10', shape: 'range' })]);
    expect(s.fullColumnReferences).toHaveLength(0);
    expect(s.maxNestingDepth).toBe(1);
    expect(s.unknownFunctions).toHaveLength(0);
  });

  it('Test 2 — =IF(A1>100,"High","Low")', () => {
    const s = analyzeFormula('=IF(A1>100,"High","Low")');
    expect(s.conditions).toEqual([
      { source: 'A1>100', kind: 'comparison', operator: '>', owner: 'IF' },
    ]);
    expect(s.constants.numbers).toContain(100);
    expect(s.constants.strings).toEqual(expect.arrayContaining(['High', 'Low']));
    expect(s.hasComparison).toBe(true);
  });

  it('Test 3 — =IFERROR(A2/B2,0)', () => {
    const s = analyzeFormula('=IFERROR(A2/B2,0)');
    expect(s.hasDivision).toBe(true);
    expect(s.errorHandlingFunctions).toEqual(['IFERROR']);
    expect(s.constants.numbers).toEqual([0]);
  });

  it('Test 4 — =SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))', () => {
    const s = analyzeFormula('=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))');
    expect(fnNames('=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))').sort()).toEqual(['DATE', 'SUMIFS']);
    expect(s.fullColumnReferences.map((r) => r.raw).sort()).toEqual(['A:A', 'B:B', 'C:C']);
    expect(s.dates).toEqual([{ source: 'DATE(2026,1,1)', iso: '2026-01-01' }]);
    expect(s.hasConcatenation).toBe(true);
    expect(s.hasComparison).toBe(false); // ">=" is a string, not an operator
    expect(s.conditions.filter((c) => c.owner === 'SUMIFS')).toHaveLength(2);
  });

  it('Test 5 — =XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")', () => {
    const s = analyzeFormula('=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")');
    expect(s.lookups).toEqual([
      { function: 'XLOOKUP', hasFallback: true, approximateMatch: undefined },
    ]);
    expect(s.sheetReferences).toEqual(['Sheet2']);
    expect(s.fullColumnReferences).toHaveLength(2);
  });

  it('Test 6 — =ROUND(AVERAGE(B2:B12),2)', () => {
    const s = analyzeFormula('=ROUND(AVERAGE(B2:B12),2)');
    expect(s.maxNestingDepth).toBe(2);
    expect(s.functions.map((f) => f.name)).toEqual(['AVERAGE', 'ROUND']); // deepest first
    expect(s.constants.numbers).toEqual([2]);
  });
});

describe('analyzeFormula — detail extraction', () => {
  it('flags approximate + hardcoded-index VLOOKUP', () => {
    expect(analyzeFormula('=VLOOKUP(A2,D:F,3)').lookups[0]).toEqual({
      function: 'VLOOKUP',
      approximateMatch: true,
      hardcodedColumnIndex: true,
    });
    expect(analyzeFormula('=VLOOKUP(A2,D:F,3,FALSE)').lookups[0]).toMatchObject({
      approximateMatch: false,
    });
  });

  it('measures nested IF depth', () => {
    expect(analyzeFormula('=IF(A1=1,"a",IF(A1=2,"b","c"))').nestedIfDepth).toBe(2);
    expect(analyzeFormula('=IF(A1=1,"a","b")').nestedIfDepth).toBe(1);
  });

  it('marks unknown functions', () => {
    const s = analyzeFormula('=BITAND(A1,2)');
    expect(s.unknownFunctions).toEqual(['BITAND']);
    expect(s.functions[0]?.known).toBe(false);
  });

  it('detects volatile functions', () => {
    expect(analyzeFormula('=A1+TODAY()').volatileFunctions).toEqual(['TODAY']);
    expect(analyzeFormula('=OFFSET(A1,1,1)').volatileFunctions).toEqual(['OFFSET']);
  });

  it('collects named ranges and distinct operators', () => {
    const s = analyzeFormula('=Revenue-Cost+Revenue*Tax');
    expect(s.namedRanges).toEqual(['Cost', 'Revenue', 'Tax']);
    expect(s.operators.sort()).toEqual(['*', '+', '-']);
  });

  it('handles the nested vision formula end to end', () => {
    const s = analyzeFormula(
      '=IFERROR(SUMIFS(SALES!$U:$U,SALES!$G:$G,A2,SALES!$U:$U,">="&DATE(2026,9,1),SALES!$U:$U,"<="&DATE(2026,9,30)),0)',
    );
    expect(s.functions.map((f) => f.name).sort()).toEqual(['DATE', 'IFERROR', 'SUMIFS']);
    expect(s.errorHandlingFunctions).toEqual(['IFERROR']);
    expect(s.sheetReferences).toEqual(['SALES']);
    expect(s.fullColumnReferences.length).toBeGreaterThanOrEqual(4);
    expect(s.dates.map((d) => d.iso)).toEqual(['2026-09-01', '2026-09-30']);
    expect(s.maxNestingDepth).toBe(3);
  });
});
