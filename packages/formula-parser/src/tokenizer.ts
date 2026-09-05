import { FormulaParseError } from './errors';
import type { Token, TokenType } from './types';

/** Excel error literals, longest first so `#N/A` is not shadowed by `#N`. */
const ERROR_LITERALS = [
  '#GETTING_DATA',
  '#SPILL!',
  '#BLOCKED!',
  '#CONNECT!',
  '#UNKNOWN!',
  '#FIELD!',
  '#CALC!',
  '#PYTHON!',
  '#DIV/0!',
  '#VALUE!',
  '#NAME?',
  '#NULL!',
  '#NUM!',
  '#REF!',
  '#N/A',
];

const TWO_CHAR_OPERATORS = ['<>', '<=', '>='];
const ONE_CHAR_OPERATORS = new Set(['+', '-', '*', '/', '^', '&', '=', '<', '>', '%', ':']);

const NUMBER_RE = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
const IDENT_START = /[A-Za-z_\\À-￿]/;
const IDENT_BODY = /[A-Za-z0-9_.À-￿]/;

const COLUMN_RANGE_RE = /^\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}(?![A-Za-z0-9_.[(])/;
const ROW_RANGE_RE = /^\$?\d{1,7}:\$?\d{1,7}(?![A-Za-z0-9_.[(])/;
const CELL_RE = /^\$?[A-Za-z]{1,3}\$?\d{1,7}(?![A-Za-z0-9_.[(])/;

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

/**
 * Convert a formula body (no leading `=`) into a flat token stream.
 *
 * Known limitations (analysis-only parser): the intersection operator (space)
 * and the implicit-intersection operator (`@`) are dropped; locale separators
 * other than `,` / `;` are not supported.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: TokenType, value: string, start: number, end: number): void => {
    tokens.push({ type, value, start, end });
  };

  while (i < source.length) {
    const ch = source[i] as string;

    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }

    // Implicit-intersection operator — dropped for analysis.
    if (ch === '@') {
      i += 1;
      continue;
    }

    // String literal.
    if (ch === '"') {
      const start = i;
      i += 1;
      let value = '';
      let closed = false;
      while (i < source.length) {
        const c = source[i] as string;
        if (c === '"') {
          if (source[i + 1] === '"') {
            value += '"';
            i += 2;
            continue;
          }
          i += 1;
          closed = true;
          break;
        }
        value += c;
        i += 1;
      }
      if (!closed) {
        throw new FormulaParseError('Unterminated string literal', start, source);
      }
      push('string', value, start, i);
      continue;
    }

    // Error literal.
    if (ch === '#') {
      const upper = source.slice(i).toUpperCase();
      const match = ERROR_LITERALS.find((lit) => upper.startsWith(lit));
      if (match) {
        push('error', match, i, i + match.length);
        i += match.length;
        continue;
      }
      throw new FormulaParseError(`Unrecognized error literal near "${source.slice(i, i + 8)}"`, i, source);
    }

    // Full-row reference (e.g. `1:1`, `$1:$5`). Must be checked before generic
    // number parsing below, or a bare digit run would be consumed as a
    // NumberLiteral before ever reaching the row-range pattern.
    if (ch >= '0' && ch <= '9') {
      const rowMatch = ROW_RANGE_RE.exec(source.slice(i));
      if (rowMatch) {
        const raw = rowMatch[0];
        push('ref', raw, i, i + raw.length);
        i += raw.length;
        continue;
      }
    }

    // Number literal.
    const numMatch = NUMBER_RE.exec(source.slice(i));
    if (numMatch) {
      const raw = numMatch[0];
      push('number', raw, i, i + raw.length);
      i += raw.length;
      continue;
    }

    // Structural punctuation.
    if (ch === '(') {
      push('lparen', ch, i, i + 1);
      i += 1;
      continue;
    }
    if (ch === ')') {
      push('rparen', ch, i, i + 1);
      i += 1;
      continue;
    }
    if (ch === '{') {
      push('lbrace', ch, i, i + 1);
      i += 1;
      continue;
    }
    if (ch === '}') {
      push('rbrace', ch, i, i + 1);
      i += 1;
      continue;
    }
    if (ch === ',') {
      push('comma', ch, i, i + 1);
      i += 1;
      continue;
    }
    if (ch === ';') {
      push('semicolon', ch, i, i + 1);
      i += 1;
      continue;
    }

    // Operators.
    const twoChar = source.slice(i, i + 2);
    if (TWO_CHAR_OPERATORS.includes(twoChar)) {
      push('operator', twoChar, i, i + 2);
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPERATORS.has(ch)) {
      push('operator', ch, i, i + 1);
      i += 1;
      continue;
    }

    // Reference / name / function / boolean (with an optional sheet prefix).
    if (IDENT_START.test(ch) || ch === '$' || ch === "'") {
      const start = i;
      const rest = source.slice(i);
      const sheet = readSheetPrefix(rest);
      let cursor = sheet ? sheet.consumed : 0;
      const afterSheet = rest.slice(cursor);
      const hadSheet = sheet !== null;

      const refMatch =
        COLUMN_RANGE_RE.exec(afterSheet) ??
        ROW_RANGE_RE.exec(afterSheet) ??
        CELL_RE.exec(afterSheet);

      if (refMatch) {
        const body = refMatch[0];
        cursor += body.length;
        const value = hadSheet ? `${sheet.normalized}!${body}` : body;
        push('ref', value, start, start + cursor);
        i = start + cursor;
        continue;
      }

      // Identifier body.
      const identMatch = readIdentifier(afterSheet);
      if (identMatch) {
        cursor += identMatch.length;
        const end = start + cursor;
        const next = source[end];

        // Structured (table) reference: Ident[...]
        if (next === '[') {
          const bracket = readBalancedBrackets(source, end);
          const raw = source.slice(start, bracket);
          push('structured-ref', raw, start, bracket);
          i = bracket;
          continue;
        }

        if (next === '(') {
          push('function', identMatch, start, end);
          i = end;
          continue;
        }

        const isBool = /^(?:true|false)$/i.test(identMatch);
        if (isBool && !hadSheet) {
          push('boolean', identMatch.toUpperCase(), start, end);
          i = end;
          continue;
        }

        const value = hadSheet ? `${sheet.normalized}!${identMatch}` : identMatch;
        push('name', value, start, end);
        i = end;
        continue;
      }

      if (hadSheet) {
        throw new FormulaParseError('Expected a reference or name after the sheet prefix', start, source);
      }
      throw new FormulaParseError(`Unexpected character "${ch}"`, i, source);
    }

    throw new FormulaParseError(`Unexpected character "${ch}"`, i, source);
  }

  tokens.push({ type: 'eof', value: '', start: source.length, end: source.length });
  return tokens;
}

interface SheetPrefix {
  normalized: string;
  consumed: number;
}

/** Match `Sheet1!`, `'My Sheet'!`, or a 3-D `Jan:Dec!` prefix. Returns `null` if absent. */
function readSheetPrefix(input: string): SheetPrefix | null {
  const readOne = (from: number): { name: string; end: number } | null => {
    if (input[from] === "'") {
      let j = from + 1;
      let name = '';
      while (j < input.length) {
        const c = input[j] as string;
        if (c === "'") {
          if (input[j + 1] === "'") {
            name += "'";
            j += 2;
            continue;
          }
          j += 1;
          return { name, end: j };
        }
        name += c;
        j += 1;
      }
      return null;
    }
    if (!IDENT_START.test(input[from] ?? '')) return null;
    let j = from;
    while (j < input.length && /[A-Za-z0-9_.À-￿]/.test(input[j] as string)) j += 1;
    return { name: input.slice(from, j), end: j };
  };

  const first = readOne(0);
  if (!first) return null;

  let end = first.end;
  const normalized = first.name;

  if (input[end] === ':') {
    const second = readOne(end + 1);
    if (second && input[second.end] === '!') {
      return { normalized: `${first.name}:${second.name}`, consumed: second.end + 1 };
    }
    return null;
  }

  if (input[end] !== '!') return null;
  end += 1;
  return { normalized, consumed: end };
}

function readIdentifier(input: string): string | null {
  if (!IDENT_START.test(input[0] ?? '')) return null;
  let j = 1;
  while (j < input.length && IDENT_BODY.test(input[j] as string)) j += 1;
  return input.slice(0, j);
}

/** Given `source` with `source[open] === '['`, return the index just past the matching `]`. */
function readBalancedBrackets(source: string, open: number): number {
  let depth = 0;
  let j = open;
  while (j < source.length) {
    const c = source[j];
    if (c === '[') depth += 1;
    else if (c === ']') {
      depth -= 1;
      if (depth === 0) return j + 1;
    }
    j += 1;
  }
  throw new FormulaParseError('Unbalanced "[" in structured reference', open, source);
}
