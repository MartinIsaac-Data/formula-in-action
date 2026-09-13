import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import { detectRisks } from '@formula-in-action/risk-detector';
import { describe, expect, it } from 'vitest';
import { scoreFormula } from './score';

const health = (formula: string): ReturnType<typeof scoreFormula> => {
  const structured = analyzeFormula(formula);
  return scoreFormula(structured, detectRisks(structured));
};

/** Over 250 characters, but using only a known function and plain cell refs. */
const veryLongFormula = (): string =>
  `=SUM(${Array.from({ length: 80 }, (_, i) => `A${i + 1}`).join(',')})`;

describe('scoreFormula', () => {
  it('gives a clean, simple formula a top score', () => {
    const result = health('=SUM(A1:A10)');
    expect(result.score).toBe(100);
    expect(result.band).toBe('excellent');
    for (const dimension of Object.values(result.dimensions)) {
      expect(dimension.penalties).toEqual([]);
    }
  });

  it('is deterministic — the same formula always scores the same', () => {
    const formula = '=IFERROR(VLOOKUP(A2,Sheet2!A:C,3,TRUE),0)';
    expect(health(formula)).toEqual(health(formula));
  });

  it('charges an unguarded division to reliability', () => {
    const result = health('=A2/B2');
    expect(result.dimensions.reliability.score).toBeLessThan(100);
    expect(result.dimensions.reliability.penalties.map((p) => p.id)).toContain('division-risk');
    // A division risk says nothing about how the formula reads.
    expect(result.dimensions.readability.score).toBe(100);
  });

  it('does not charge a division that is already guarded', () => {
    expect(health('=IFERROR(A2/B2,0)').dimensions.reliability.score).toBe(100);
  });

  it('charges volatile functions and whole-column ranges to performance', () => {
    const ids = health('=SUM(A:A)*TODAY()').dimensions.performance.penalties.map((p) => p.id);
    expect(ids).toContain('full-column-performance');
    expect(ids).toContain('volatile-recalculation');
  });

  it('flags a legacy lookup as a maintainability cost even when it is written safely', () => {
    const result = health('=IFERROR(VLOOKUP(A2,Table1[#All],2,FALSE),"")');
    expect(result.dimensions.maintainability.penalties.map((p) => p.id)).toContain('legacy-lookup');
    expect(result.dimensions.reliability.score).toBe(100);
  });

  it('does not flag a modern lookup as legacy', () => {
    const ids = health('=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")')
      .dimensions.maintainability.penalties.map((p) => p.id);
    expect(ids).not.toContain('legacy-lookup');
  });

  it('penalises a very long formula on readability only', () => {
    const result = health(veryLongFormula());
    expect(result.dimensions.readability.penalties.map((p) => p.id)).toContain('very-long-formula');
    expect(result.dimensions.reliability.score).toBe(100);
  });

  it('ranks penalties hardest-first and never drops a dimension below 0', () => {
    const result = health('=A1/B1*TODAY()+SUM(C:C)/D1');
    for (const dimension of Object.values(result.dimensions)) {
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      const points = dimension.penalties.map((p) => p.points);
      expect([...points].sort((a, b) => b - a)).toEqual(points);
    }
  });

  it('bands the overall score', () => {
    expect(health('=SUM(A1:A10)').band).toBe('excellent');
    expect(health('=A1/B1*TODAY()+SUM(C:C)/D1').score).toBeLessThan(
      health('=SUM(A1:A10)').score,
    );
  });

  it('never lets good dimensions dilute a broken reliability score', () => {
    // Short and perfectly readable, but divides without a guard AND does an
    // approximate-match lookup. A plain weighted mean called this "good".
    const result = health('=VLOOKUP(A2,Sheet2!A:C,3,TRUE)/B2');
    expect(result.dimensions.readability.score).toBe(100);
    expect(result.dimensions.reliability.score).toBeLessThan(55);
    expect(result.band).not.toBe('good');
    expect(result.band).not.toBe('excellent');
    expect(result.score).toBeLessThanOrEqual(result.dimensions.reliability.score + 15);
  });

  it('leaves a healthy formula unaffected by the reliability ceiling', () => {
    expect(health('=SUM(A1:A10)').score).toBe(100);
  });

  it('weights reliability above the other dimensions', () => {
    // Same single 25-point-class problem, moved between dimensions: the
    // reliability hit must cost the overall score more.
    const unreliable = health('=A2/B2').score;
    const unreadable = health(veryLongFormula()).score;
    expect(unreliable).toBeLessThan(unreadable);
  });
});
