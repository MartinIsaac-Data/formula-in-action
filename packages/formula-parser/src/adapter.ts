import { parseFormula } from './parser';
import type { FormulaParserAdapter, ParsedFormula } from './types';

/**
 * Default parser implementation (hand-written tokenizer + Pratt parser).
 *
 * Kept behind {@link FormulaParserAdapter} so it can be swapped for a
 * third-party grammar later without touching the analyzer or the API.
 */
export class DefaultFormulaParser implements FormulaParserAdapter {
  readonly name = 'default';

  parse(formula: string): ParsedFormula {
    return parseFormula(formula);
  }
}

export const defaultFormulaParser: FormulaParserAdapter = new DefaultFormulaParser();
