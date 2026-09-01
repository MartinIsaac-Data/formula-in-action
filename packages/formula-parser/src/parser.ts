import { FormulaParseError } from './errors';
import { tokenize } from './tokenizer';
import type {
  BinaryOperator,
  FormulaNode,
  ParsedFormula,
  ReferenceNode,
  Token,
  TokenType,
} from './types';

/** Left/right binding power per infix operator (higher binds tighter, left-assoc). */
const INFIX_BP: Record<string, { left: number; right: number }> = {
  '=': { left: 20, right: 21 },
  '<>': { left: 20, right: 21 },
  '<': { left: 20, right: 21 },
  '>': { left: 20, right: 21 },
  '<=': { left: 20, right: 21 },
  '>=': { left: 20, right: 21 },
  '&': { left: 30, right: 31 },
  '+': { left: 40, right: 41 },
  '-': { left: 40, right: 41 },
  '*': { left: 50, right: 51 },
  '/': { left: 50, right: 51 },
  '^': { left: 60, right: 61 },
};

const COLUMN_RANGE_RE = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})$/;
const ROW_RANGE_RE = /^(\$?)(\d{1,7}):(\$?)(\d{1,7})$/;
const CELL_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/;

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly source: string,
  ) {}

  parse(): FormulaNode {
    if (this.peek().type === 'eof') {
      throw new FormulaParseError('Empty formula', 0, this.source);
    }
    const node = this.parseExpression(0);
    const trailing = this.peek();
    if (trailing.type !== 'eof') {
      throw new FormulaParseError(`Unexpected "${trailing.value}"`, trailing.start, this.source);
    }
    return node;
  }

  private peek(): Token {
    return this.tokens[this.pos] as Token;
  }

  private next(): Token {
    const token = this.tokens[this.pos] as Token;
    if (token.type !== 'eof') this.pos += 1;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new FormulaParseError(
        `Expected ${type} but found "${token.value || token.type}"`,
        token.start,
        this.source,
      );
    }
    return this.next();
  }

  private parseExpression(minBp: number): FormulaNode {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (token.type !== 'operator') break;
      const bp = INFIX_BP[token.value];
      if (!bp || bp.left < minBp) break;
      this.next();
      const right = this.parseExpression(bp.right);
      left = {
        type: 'BinaryExpression',
        operator: token.value as BinaryOperator,
        left,
        right,
        start: left.start,
        end: right.end,
      };
    }
    return left;
  }

  private parseUnary(): FormulaNode {
    const token = this.peek();
    if (token.type === 'operator' && (token.value === '-' || token.value === '+')) {
      this.next();
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: token.value,
        operand,
        start: token.start,
        end: operand.end,
      };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): FormulaNode {
    let node = this.parsePrimary();
    while (this.peek().type === 'operator' && this.peek().value === '%') {
      const percent = this.next();
      node = {
        type: 'PostfixExpression',
        operator: '%',
        operand: node,
        start: node.start,
        end: percent.end,
      };
    }
    return node;
  }

  private parsePrimary(): FormulaNode {
    const token = this.peek();
    switch (token.type) {
      case 'number': {
        this.next();
        return { type: 'NumberLiteral', value: Number(token.value), raw: token.value, start: token.start, end: token.end };
      }
      case 'string': {
        this.next();
        return { type: 'StringLiteral', value: token.value, start: token.start, end: token.end };
      }
      case 'boolean': {
        this.next();
        return { type: 'BooleanLiteral', value: /^true$/i.test(token.value), start: token.start, end: token.end };
      }
      case 'error': {
        this.next();
        return { type: 'ErrorLiteral', value: token.value, start: token.start, end: token.end };
      }
      case 'lparen': {
        this.next();
        const expression = this.parseExpression(0);
        const close = this.expect('rparen');
        return { type: 'ParenthesizedExpression', expression, start: token.start, end: close.end };
      }
      case 'lbrace':
        return this.parseArray();
      case 'function':
        return this.parseFunctionCall();
      case 'structured-ref': {
        this.next();
        const table = token.value.includes('[') ? token.value.slice(0, token.value.indexOf('[')) : undefined;
        return { type: 'StructuredReference', table: table || undefined, raw: token.value, start: token.start, end: token.end };
      }
      case 'ref':
        return this.parseReferenceOrRange();
      case 'name': {
        this.next();
        const idx = token.value.lastIndexOf('!');
        const sheet = idx >= 0 ? token.value.slice(0, idx) : undefined;
        const name = idx >= 0 ? token.value.slice(idx + 1) : token.value;
        return { type: 'NamedReference', name, sheet, start: token.start, end: token.end };
      }
      default:
        throw new FormulaParseError(
          `Unexpected "${token.value || token.type}"`,
          token.start,
          this.source,
        );
    }
  }

  private parseFunctionCall(): FormulaNode {
    const fn = this.next();
    this.expect('lparen');
    const args: FormulaNode[] = [];

    if (this.peek().type !== 'rparen') {
      for (;;) {
        const current = this.peek();
        if (current.type === 'comma' || current.type === 'rparen') {
          args.push({ type: 'EmptyArgument', start: current.start, end: current.start });
        } else {
          args.push(this.parseExpression(0));
        }
        if (this.peek().type === 'comma') {
          this.next();
          continue;
        }
        break;
      }
    }

    const close = this.expect('rparen');
    return {
      type: 'FunctionCall',
      name: fn.value.toUpperCase(),
      args,
      start: fn.start,
      end: close.end,
    };
  }

  private parseArray(): FormulaNode {
    const open = this.expect('lbrace');
    const rows: FormulaNode[][] = [];
    let row: FormulaNode[] = [];

    for (;;) {
      row.push(this.parseExpression(0));
      const token = this.peek();
      if (token.type === 'comma') {
        this.next();
        continue;
      }
      if (token.type === 'semicolon') {
        this.next();
        rows.push(row);
        row = [];
        continue;
      }
      break;
    }
    rows.push(row);

    const close = this.expect('rbrace');
    return { type: 'ArrayLiteral', rows, start: open.start, end: close.end };
  }

  private parseReferenceOrRange(): FormulaNode {
    const first = this.next();
    const fromRef = this.makeReference(first);

    if (this.peek().type === 'operator' && this.peek().value === ':') {
      this.next();
      const second = this.peek();
      if (second.type !== 'ref') {
        throw new FormulaParseError('Expected a cell reference after ":"', second.start, this.source);
      }
      this.next();
      const toRef = this.makeReference(second);
      return {
        type: 'Range',
        sheet: fromRef.sheet,
        sheetTo: fromRef.sheetTo,
        raw: `${first.value}:${second.value}`,
        from: fromRef,
        to: toRef,
        start: first.start,
        end: second.end,
      };
    }

    return fromRef;
  }

  private makeReference(token: Token): ReferenceNode {
    const idx = token.value.lastIndexOf('!');
    const sheetPart = idx >= 0 ? token.value.slice(0, idx) : undefined;
    const body = idx >= 0 ? token.value.slice(idx + 1) : token.value;
    const [sheet, sheetTo] = sheetPart ? splitSheets(sheetPart) : [undefined, undefined];

    const base = {
      type: 'Reference' as const,
      sheet,
      sheetTo,
      raw: token.value,
      start: token.start,
      end: token.end,
    };

    const col = COLUMN_RANGE_RE.exec(body);
    if (col) {
      return {
        ...base,
        kind: 'column',
        column: col[2].toUpperCase(),
        endColumn: col[4].toUpperCase(),
        absoluteColumn: col[1] === '$',
        absoluteRow: false,
      };
    }

    const rowMatch = ROW_RANGE_RE.exec(body);
    if (rowMatch) {
      return {
        ...base,
        kind: 'row',
        row: rowMatch[2],
        endRow: rowMatch[4],
        absoluteColumn: false,
        absoluteRow: rowMatch[1] === '$',
      };
    }

    const cell = CELL_RE.exec(body);
    if (cell) {
      return {
        ...base,
        kind: 'cell',
        column: cell[2].toUpperCase(),
        row: cell[4],
        absoluteColumn: cell[1] === '$',
        absoluteRow: cell[3] === '$',
      };
    }

    throw new FormulaParseError(`Malformed reference "${token.value}"`, token.start, this.source);
  }
}

function splitSheets(sheetPart: string): [string, string | undefined] {
  const colon = sheetPart.indexOf(':');
  if (colon >= 0) {
    return [sheetPart.slice(0, colon), sheetPart.slice(colon + 1)];
  }
  return [sheetPart, undefined];
}

/** Remove a single leading `=` (and surrounding whitespace) from a cell formula. */
export function normalizeFormula(formula: string): string {
  const trimmed = formula.trim();
  return trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
}

export function parseFormula(formula: string): ParsedFormula {
  const source = normalizeFormula(formula);
  if (source.length === 0) {
    throw new FormulaParseError('Formula is empty', 0, source);
  }
  const tokens = tokenize(source);
  const ast = new Parser(tokens, source).parse();
  return { source, ast };
}
