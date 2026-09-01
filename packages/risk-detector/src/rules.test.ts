import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { describe, expect, it } from 'vitest';
import { detectRisks } from './rules/index';

const ids = (formula: string): string[] =>
  detectRisks(analyzeFormula(formula)).map((w) => w.id);

describe('detectRisks', () => {
  it('flags an unguarded division', () => {
    const warnings = detectRisks(analyzeFormula('=A2/B2'));
    expect(warnings[0]).toMatchObject({ id: 'division-risk', severity: 'warning', formulaPart: 'A2/B2' });
  });

  it('does not flag a division already wrapped in IFERROR', () => {
    expect(ids('=IFERROR(A2/B2,0)')).not.toContain('division-risk');
  });

  it('flags whole-column references', () => {
    expect(ids('=SUM(A:A)')).toContain('full-column-performance');
  });

  it('flags a hard-coded rate but not benign integers', () => {
    expect(ids('=Sales*0.15')).toContain('hardcoded-value');
    expect(ids('=Sales*2')).not.toContain('hardcoded-value');
  });

  it('flags volatile functions', () => {
    expect(ids('=A1+TODAY()')).toContain('volatile-recalculation');
  });

  it('flags approximate-match and hard-coded-index VLOOKUP', () => {
    const warnings = ids('=VLOOKUP(A2,D:F,3)');
    expect(warnings).toEqual(expect.arrayContaining(['vlookup-approximate-match', 'vlookup-fragile-index']));
  });

  it('flags deeply nested IFs', () => {
    expect(ids('=IF(A1=1,1,IF(A1=2,2,IF(A1=3,3,4)))')).toContain('deep-nested-if');
  });

  it('flags unsupported functions', () => {
    expect(ids('=BITAND(A1,2)')).toContain('unsupported-function');
  });

  it('orders warnings by severity (warning before info)', () => {
    const severities = detectRisks(analyzeFormula('=VLOOKUP(A2,D:F,3)/B2')).map((w) => w.severity);
    const firstInfo = severities.indexOf('info');
    const lastWarning = severities.lastIndexOf('warning');
    expect(lastWarning).toBeLessThan(firstInfo === -1 ? Infinity : firstInfo);
  });

  it('returns nothing for a clean formula', () => {
    expect(detectRisks(analyzeFormula('=SUM(B2:B12)'))).toHaveLength(0);
  });
});
