import { parseFormula, traverse, unwrap } from '@formula-in-action/formula-parser';
import type {
  FormulaNode,
  FunctionCallNode,
  ParsedFormula,
  RangeNode,
  ReferenceNode,
} from '@formula-in-action/formula-parser';
import {
  ERROR_HANDLING_FUNCTIONS,
  getFunctionSpec,
  VOLATILE_FUNCTIONS,
} from './functions/registry';
import type {
  ConditionSummary,
  DateSummary,
  DetectedFunctionUse,
  LookupSummary,
  ReferenceSummary,
  StructuredFormula,
} from './types';

const COMPARISON_OPERATORS = new Set(['=', '<>', '<', '>', '<=', '>=']);
const ARITHMETIC_OPERATORS = new Set(['+', '-', '*', '/', '^']);

/** `COUNTIFS(range1, criteria1, range2, criteria2, ...)` — criteria at odd indices. */
const CRITERIA_AT_ODD = new Set(['COUNTIFS']);
/** `SUMIFS(sum_range, range1, criteria1, ...)` — criteria at indices 2, 4, 6, ... */
const CRITERIA_FROM_TWO = new Set(['SUMIFS', 'AVERAGEIFS']);

const uniq = <T>(values: T[]): T[] => [...new Set(values)];

export function analyzeFormula(input: string | ParsedFormula): StructuredFormula {
  const parsed: ParsedFormula = typeof input === 'string' ? parseFormula(input) : input;
  const { source, ast } = parsed;
  const formula = typeof input === 'string' ? input : `=${source}`;
  const sliceOf = (node: FormulaNode): string => source.slice(node.start, node.end);

  const functionUses = new Map<string, DetectedFunctionUse>();
  const operators: string[] = [];
  const numbers: number[] = [];
  const strings: string[] = [];
  const booleans: boolean[] = [];
  const errorLiterals: string[] = [];
  const namedRanges: string[] = [];
  const structuredReferences: string[] = [];
  const references: ReferenceSummary[] = [];
  const sheetNames: string[] = [];
  const dates: DateSummary[] = [];
  const conditions: ConditionSummary[] = [];
  const lookups: LookupSummary[] = [];

  let maxNestingDepth = 0;
  let nestedIfDepth = 0;
  let hasArithmetic = false;
  let hasComparison = false;
  let hasConcatenation = false;
  let hasDivision = false;

  traverse(ast, (node, ancestors) => {
    const functionDepth = ancestors.filter((a) => a.type === 'FunctionCall').length;

    switch (node.type) {
      case 'FunctionCall': {
        const depth = functionDepth + 1;
        maxNestingDepth = Math.max(maxNestingDepth, depth);
        recordFunctionUse(functionUses, node, depth);

        if (node.name === 'IF') {
          const ifDepth = ancestors.filter((a) => a.type === 'FunctionCall' && a.name === 'IF').length + 1;
          nestedIfDepth = Math.max(nestedIfDepth, ifDepth);
        }
        if (node.name === 'DATE') dates.push(describeDate(node, sliceOf));
        conditions.push(...describeConditions(node, sliceOf));
        const lookup = describeLookup(node);
        if (lookup) lookups.push(lookup);
        break;
      }
      case 'BinaryExpression': {
        operators.push(node.operator);
        if (COMPARISON_OPERATORS.has(node.operator)) hasComparison = true;
        if (ARITHMETIC_OPERATORS.has(node.operator)) hasArithmetic = true;
        if (node.operator === '&') hasConcatenation = true;
        if (node.operator === '/') hasDivision = true;
        break;
      }
      case 'UnaryExpression':
        if (node.operator === '-') hasArithmetic = true;
        break;
      case 'PostfixExpression':
        operators.push('%');
        break;
      case 'NumberLiteral':
        numbers.push(node.value);
        break;
      case 'StringLiteral':
        strings.push(node.value);
        break;
      case 'BooleanLiteral':
        booleans.push(node.value);
        break;
      case 'ErrorLiteral':
        errorLiterals.push(node.value);
        break;
      case 'NamedReference':
        namedRanges.push(node.name);
        if (node.sheet) sheetNames.push(node.sheet);
        break;
      case 'StructuredReference':
        structuredReferences.push(node.raw);
        if (node.table) structuredReferences.push(node.table);
        break;
      case 'Reference': {
        const parent = ancestors[ancestors.length - 1];
        if (parent?.type === 'Range') break; // counted as part of the range
        references.push(summarizeReference(node));
        if (node.sheet) sheetNames.push(node.sheet);
        if (node.sheetTo) sheetNames.push(node.sheetTo);
        break;
      }
      case 'Range': {
        references.push(summarizeRange(node));
        if (node.sheet) sheetNames.push(node.sheet);
        if (node.sheetTo) sheetNames.push(node.sheetTo);
        break;
      }
      default:
        break;
    }
  });

  const functions = [...functionUses.values()].sort((a, b) => b.maxDepth - a.maxDepth || a.name.localeCompare(b.name));
  const usedNames = new Set(functions.map((f) => f.name));

  return {
    formula,
    normalizedFormula: source,
    ast,
    functions,
    unknownFunctions: functions.filter((f) => !f.known).map((f) => f.name),
    volatileFunctions: [...usedNames].filter((name) => VOLATILE_FUNCTIONS.has(name)),
    errorHandlingFunctions: [...usedNames].filter((name) => ERROR_HANDLING_FUNCTIONS.has(name)),
    maxNestingDepth,
    nestedIfDepth,
    operators: uniq(operators),
    hasArithmetic,
    hasComparison,
    hasConcatenation,
    hasDivision,
    references,
    fullColumnReferences: references.filter((r) => r.isFullColumn),
    fullRowReferences: references.filter((r) => r.isFullRow),
    sheetReferences: uniq(sheetNames).sort(),
    namedRanges: uniq(namedRanges).sort(),
    structuredReferences: uniq(structuredReferences).sort(),
    constants: { numbers: uniq(numbers), strings: uniq(strings), booleans: uniq(booleans) },
    dates,
    errorLiterals: uniq(errorLiterals),
    conditions,
    lookups,
  };
}

function recordFunctionUse(
  map: Map<string, DetectedFunctionUse>,
  node: FunctionCallNode,
  depth: number,
): void {
  const spec = getFunctionSpec(node.name);
  const existing = map.get(node.name);
  if (existing) {
    existing.count += 1;
    existing.argCounts.push(node.args.length);
    existing.maxDepth = Math.max(existing.maxDepth, depth);
    return;
  }
  map.set(node.name, {
    name: node.name,
    count: 1,
    known: spec !== undefined,
    category: spec?.category,
    purpose: spec?.purpose,
    detail: spec?.detail,
    argRoles: spec?.argRoles,
    argCounts: [node.args.length],
    maxDepth: depth,
  });
}

function summarizeReference(node: ReferenceNode): ReferenceSummary {
  return {
    raw: node.raw,
    shape: node.kind,
    sheet: node.sheet,
    isFullColumn: node.kind === 'column',
    isFullRow: node.kind === 'row',
    isAbsolute: Boolean(node.absoluteColumn && node.absoluteRow),
  };
}

function summarizeRange(node: RangeNode): ReferenceSummary {
  return {
    raw: node.raw,
    shape: 'range',
    sheet: node.sheet,
    isFullColumn: false,
    isFullRow: false,
    isAbsolute: Boolean(
      node.from.absoluteColumn &&
        node.from.absoluteRow &&
        node.to.absoluteColumn &&
        node.to.absoluteRow,
    ),
  };
}

function describeDate(node: FunctionCallNode, sliceOf: (n: FormulaNode) => string): DateSummary {
  const parts = node.args.map((arg) => unwrap(arg));
  const allLiterals = parts.length === 3 && parts.every((p) => p.type === 'NumberLiteral');
  if (allLiterals) {
    const [y, m, d] = parts.map((p) => (p.type === 'NumberLiteral' ? p.value : 0));
    const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { source: sliceOf(node), iso };
  }
  return { source: sliceOf(node) };
}

function describeConditions(
  node: FunctionCallNode,
  sliceOf: (n: FormulaNode) => string,
): ConditionSummary[] {
  const out: ConditionSummary[] = [];
  const { name, args } = node;

  const pushTest = (arg: FormulaNode | undefined): void => {
    if (!arg || arg.type === 'EmptyArgument') return;
    const inner = unwrap(arg);
    if (inner.type === 'BinaryExpression' && COMPARISON_OPERATORS.has(inner.operator)) {
      out.push({ source: sliceOf(arg), kind: 'comparison', operator: inner.operator, owner: name });
    } else {
      out.push({ source: sliceOf(arg), kind: 'boolean-logic', owner: name });
    }
  };

  const pushCriteria = (arg: FormulaNode | undefined): void => {
    if (!arg || arg.type === 'EmptyArgument') return;
    out.push({ source: sliceOf(arg), kind: 'criteria-string', owner: name });
  };

  switch (name) {
    case 'IF':
      pushTest(args[0]);
      break;
    case 'IFS':
      for (let i = 0; i < args.length; i += 2) pushTest(args[i]);
      break;
    case 'AND':
    case 'OR':
      for (const arg of args) pushTest(arg);
      break;
    case 'COUNTIF':
    case 'SUMIF':
    case 'AVERAGEIF':
      pushCriteria(args[1]);
      break;
    default:
      if (CRITERIA_AT_ODD.has(name)) {
        for (let i = 1; i < args.length; i += 2) pushCriteria(args[i]);
      } else if (CRITERIA_FROM_TWO.has(name)) {
        for (let i = 2; i < args.length; i += 2) pushCriteria(args[i]);
      }
      break;
  }
  return out;
}

function describeLookup(node: FunctionCallNode): LookupSummary | null {
  const { name, args } = node;
  const literalNumber = (arg: FormulaNode | undefined): number | undefined => {
    if (!arg) return undefined;
    const inner = unwrap(arg);
    return inner.type === 'NumberLiteral' ? inner.value : undefined;
  };
  const literalBoolean = (arg: FormulaNode | undefined): boolean | undefined => {
    if (!arg) return undefined;
    const inner = unwrap(arg);
    return inner.type === 'BooleanLiteral' ? inner.value : undefined;
  };

  switch (name) {
    case 'VLOOKUP':
    case 'HLOOKUP': {
      const rangeArg = args[3];
      const asNumber = literalNumber(rangeArg);
      const asBool = literalBoolean(rangeArg);
      let approximateMatch: boolean | undefined;
      if (args.length < 4 || (rangeArg && rangeArg.type === 'EmptyArgument')) approximateMatch = true;
      else if (asBool !== undefined) approximateMatch = asBool;
      else if (asNumber !== undefined) approximateMatch = asNumber !== 0;
      return {
        function: name,
        approximateMatch,
        hardcodedColumnIndex: literalNumber(args[2]) !== undefined,
      };
    }
    case 'XLOOKUP': {
      const fallbackArg = args[3];
      return {
        function: name,
        hasFallback: Boolean(fallbackArg && fallbackArg.type !== 'EmptyArgument'),
        approximateMatch: literalNumber(args[4]) !== undefined ? literalNumber(args[4]) !== 0 : undefined,
      };
    }
    case 'MATCH': {
      const matchType = literalNumber(args[2]);
      return {
        function: name,
        approximateMatch: args.length < 3 ? true : matchType !== undefined ? matchType !== 0 : undefined,
      };
    }
    case 'INDEX':
      return { function: name };
    default:
      return null;
  }
}
