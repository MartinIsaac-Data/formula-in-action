import { describe, expect, it } from 'vitest';
import { parseFormula } from './parser';
import { collect } from './traverse';
import type { FunctionCallNode, ReferenceNode } from './types';

const fnNames = (formula: string): string[] =>
  collect(
    parseFormula(formula).ast,
    (n): n is FunctionCallNode => n.type === 'FunctionCall',
  ).map((n) => n.name);

const refs = (formula: string): ReferenceNode[] =>
  collect(parseFormula(formula).ast, (n): n is ReferenceNode => n.type === 'Reference');

describe('parseFormula', () => {
  it('strips a single leading = and trims', () => {
    expect(parseFormula('  =A1  ').source).toBe('A1');
  });

  it('throws on an empty formula', () => {
    expect(() => parseFormula('=')).toThrow();
  });

  describe('the six initial test formulas (requirement #17)', () => {
    it('Test 1 — =SUM(A1:A10)', () => {
      const { ast } = parseFormula('=SUM(A1:A10)');
      expect(ast.type).toBe('FunctionCall');
      expect((ast as FunctionCallNode).name).toBe('SUM');
      expect((ast as FunctionCallNode).args[0]?.type).toBe('Range');
    });

    it('Test 2 — =IF(A1>100,"High","Low")', () => {
      const { ast } = parseFormula('=IF(A1>100,"High","Low")');
      const call = ast as FunctionCallNode;
      expect(call.name).toBe('IF');
      expect(call.args).toHaveLength(3);
      expect(call.args[0]?.type).toBe('BinaryExpression');
      expect(call.args[1]).toMatchObject({ type: 'StringLiteral', value: 'High' });
    });

    it('Test 3 — =IFERROR(A2/B2,0)', () => {
      const call = parseFormula('=IFERROR(A2/B2,0)').ast as FunctionCallNode;
      expect(call.name).toBe('IFERROR');
      expect(call.args[0]).toMatchObject({ type: 'BinaryExpression', operator: '/' });
      expect(call.args[1]).toMatchObject({ type: 'NumberLiteral', value: 0 });
    });

    it('Test 4 — =SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))', () => {
      const formula = '=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))';
      expect(fnNames(formula)).toEqual(['SUMIFS', 'DATE']);
      const call = parseFormula(formula).ast as FunctionCallNode;
      expect(call.args).toHaveLength(5);
      expect(call.args[0]).toMatchObject({ type: 'Reference', kind: 'column', column: 'C' });
      expect(call.args[4]).toMatchObject({ type: 'BinaryExpression', operator: '&' });
    });

    it('Test 5 — =XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")', () => {
      const formula = '=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")';
      const call = parseFormula(formula).ast as FunctionCallNode;
      expect(call.name).toBe('XLOOKUP');
      expect(call.args).toHaveLength(4);
      expect(call.args[1]).toMatchObject({ type: 'Reference', kind: 'column', sheet: 'Sheet2' });
    });

    it('Test 6 — =ROUND(AVERAGE(B2:B12),2)', () => {
      const formula = '=ROUND(AVERAGE(B2:B12),2)';
      expect(fnNames(formula)).toEqual(['ROUND', 'AVERAGE']);
      const call = parseFormula(formula).ast as FunctionCallNode;
      expect(call.args[0]?.type).toBe('FunctionCall');
      expect(call.args[1]).toMatchObject({ type: 'NumberLiteral', value: 2 });
    });
  });

  it('parses the nested vision formula from the brief', () => {
    const formula =
      '=IFERROR(SUMIFS(SALES!$U:$U,SALES!$G:$G,A2,SALES!$U:$U,">="&DATE(2026,9,1),SALES!$U:$U,"<="&DATE(2026,9,30)),0)';
    expect(fnNames(formula)).toEqual(['IFERROR', 'SUMIFS', 'DATE', 'DATE']);
    const sheetRefs = refs(formula).filter((r) => r.sheet === 'SALES');
    expect(sheetRefs.length).toBeGreaterThanOrEqual(4);
  });

  describe('operator precedence', () => {
    it('multiplication binds tighter than addition', () => {
      const ast = parseFormula('=1+2*3').ast;
      expect(ast).toMatchObject({
        type: 'BinaryExpression',
        operator: '+',
        right: { type: 'BinaryExpression', operator: '*' },
      });
    });

    it('unary minus binds tighter than ^ (Excel: -2^2 = 4)', () => {
      expect(parseFormula('=-2^2').ast).toMatchObject({
        type: 'BinaryExpression',
        operator: '^',
        left: { type: 'UnaryExpression', operator: '-' },
      });
    });

    it('concatenation binds looser than comparison', () => {
      expect(parseFormula('=">="&DATE(2026,1,1)').ast).toMatchObject({
        type: 'BinaryExpression',
        operator: '&',
      });
    });

    it('handles postfix %', () => {
      expect(parseFormula('=A1*20%').ast).toMatchObject({
        type: 'BinaryExpression',
        operator: '*',
        right: { type: 'PostfixExpression', operator: '%' },
      });
    });
  });

  describe('references', () => {
    it('records absolute markers', () => {
      const [ref] = refs('=$A$1');
      expect(ref).toMatchObject({ absoluteColumn: true, absoluteRow: true, column: 'A', row: '1' });
    });

    it('classifies full-column vs full-row', () => {
      expect(refs('=SUM(A:A)')[0]).toMatchObject({ kind: 'column' });
      expect(refs('=SUM(1:1)')[0]).toMatchObject({ kind: 'row' });
    });
  });

  it('handles omitted arguments', () => {
    const call = parseFormula('=IF(A1,,0)').ast as FunctionCallNode;
    expect(call.args[1]?.type).toBe('EmptyArgument');
  });

  it('parses array constants', () => {
    const ast = parseFormula('={1,2;3,4}').ast;
    expect(ast.type).toBe('ArrayLiteral');
  });
});
