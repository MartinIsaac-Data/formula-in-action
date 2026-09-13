import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenizer';
import type { TokenType } from './types';

const types = (formula: string): TokenType[] => tokenize(formula).map((t) => t.type);
const values = (formula: string): string[] =>
  tokenize(formula)
    .filter((t) => t.type !== 'eof')
    .map((t) => t.value);

describe('tokenize', () => {
  it('always ends with an eof token', () => {
    expect(tokenize('1').at(-1)?.type).toBe('eof');
  });

  it('tokenizes numbers, including decimals and scientific notation', () => {
    expect(values('1+2.5+.5+1e3')).toEqual(['1', '+', '2.5', '+', '.5', '+', '1e3']);
  });

  it('tokenizes string literals with escaped quotes', () => {
    const [str] = tokenize('"a ""quoted"" word"');
    expect(str).toMatchObject({ type: 'string', value: 'a "quoted" word' });
  });

  it('distinguishes function names from bare names', () => {
    expect(types('SUM(TaxRate)')).toEqual(['function', 'lparen', 'name', 'rparen', 'eof']);
  });

  it('tokenizes booleans but not TRUE( as a boolean', () => {
    expect(tokenize('TRUE')[0]?.type).toBe('boolean');
    expect(tokenize('TRUE()')[0]?.type).toBe('function');
  });

  it('keeps full-column and full-row ranges as single ref tokens', () => {
    expect(values('SUM(A:A)')).toEqual(['SUM', '(', 'A:A', ')']);
    expect(values('SUM($U:$U)')).toEqual(['SUM', '(', '$U:$U', ')']);
    expect(values('SUM(1:1)')).toEqual(['SUM', '(', '1:1', ')']);
  });

  it('splits A1:B2 into ref : ref', () => {
    expect(values('A1:B2')).toEqual(['A1', ':', 'B2']);
  });

  it('normalizes sheet-qualified references', () => {
    expect(values("'Sales Data'!A2")).toEqual(['Sales Data!A2']);
    expect(values('SALES!$U:$U')).toEqual(['SALES!$U:$U']);
  });

  it('tokenizes error literals', () => {
    expect(tokenize('#DIV/0!')[0]).toMatchObject({ type: 'error', value: '#DIV/0!' });
    expect(tokenize('#N/A')[0]).toMatchObject({ type: 'error', value: '#N/A' });
  });

  it('recognizes two-character operators', () => {
    expect(values('A1>=B1')).toEqual(['A1', '>=', 'B1']);
    expect(values('A1<>B1')).toEqual(['A1', '<>', 'B1']);
  });

  it('captures structured references as one token', () => {
    expect(tokenize('Table1[Amount]')[0]).toMatchObject({
      type: 'structured-ref',
      value: 'Table1[Amount]',
    });
  });

  it('captures unqualified (this-row) structured references, e.g. [@Column]', () => {
    expect(tokenize('[@Amount]')[0]).toMatchObject({
      type: 'structured-ref',
      value: '[@Amount]',
    });
    expect(tokenize('[@[Availability gap vs CDP]]')[0]).toMatchObject({
      type: 'structured-ref',
      value: '[@[Availability gap vs CDP]]',
    });
  });

  it('throws on an unterminated string', () => {
    expect(() => tokenize('"oops')).toThrow(/Unterminated/);
  });
});
