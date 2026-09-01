import { traverse } from '@formula-in-action/formula-parser';
import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import type { FormulaWarning } from '@formula-in-action/shared-types';
import { findBinary, sourceOf, type RiskRule } from '../rule';

/** Values that are almost never "magic numbers" worth extracting to a cell. */
const BENIGN_NUMBERS = new Set([0, 1, 2, 10, 100, 1000, 7, 12, 24, 30, 60, 365]);

const divisionByZero: RiskRule = {
  id: 'division-risk',
  evaluate(formula) {
    if (!formula.hasDivision || formula.errorHandlingFunctions.length > 0) return [];
    const node = findBinary(formula, '/');
    return [
      {
        id: 'division-risk',
        severity: 'warning',
        title: 'Division could produce #DIV/0!',
        message:
          'If the denominator is blank or zero, Excel shows a #DIV/0! error. Wrap the ' +
          'calculation in IFERROR(...) or guard it with IF(denominator=0, ...).',
        ...(node ? { formulaPart: sourceOf(formula, node) } : {}),
      },
    ];
  },
};

const fullColumnReference: RiskRule = {
  id: 'full-column-performance',
  evaluate(formula) {
    const refs = [...formula.fullColumnReferences, ...formula.fullRowReferences];
    if (refs.length === 0) return [];
    return [
      {
        id: 'full-column-performance',
        severity: 'info',
        title: 'Whole-column references can slow large workbooks',
        message: `This formula scans entire columns/rows (${refs
          .map((r) => r.raw)
          .join(', ')}). On large workbooks, narrowing to the used range (or a Table) recalculates faster.`,
      },
    ];
  },
};

const hardcodedConstant: RiskRule = {
  id: 'hardcoded-value',
  evaluate(formula) {
    const flagged = new Set<number>();
    traverse(formula.ast, (node, ancestors) => {
      if (node.type !== 'NumberLiteral') return;
      const parent = ancestors[ancestors.length - 1];
      if (!parent || parent.type !== 'BinaryExpression') return;
      if (!['*', '/', '+', '-'].includes(parent.operator)) return;
      const isMagic = !Number.isInteger(node.value) || !BENIGN_NUMBERS.has(Math.abs(node.value));
      if (isMagic) flagged.add(node.value);
    });
    if (flagged.size === 0) return [];
    return [
      {
        id: 'hardcoded-value',
        severity: 'info',
        title: 'Hard-coded value in the calculation',
        message: `The value(s) ${[...flagged].join(', ')} are written directly into the formula. ` +
          'Storing them in a labelled parameter cell makes the logic easier to audit and update.',
      },
    ];
  },
};

const volatileFunction: RiskRule = {
  id: 'volatile-recalculation',
  evaluate(formula) {
    if (formula.volatileFunctions.length === 0) return [];
    return [
      {
        id: 'volatile-recalculation',
        severity: 'info',
        title: 'Volatile function recalculates constantly',
        message: `${formula.volatileFunctions.join(', ')} recalculates on every change anywhere in the ` +
          'workbook. That is fine for a few cells, but costly if copied down thousands of rows.',
      },
    ];
  },
};

const missingErrorHandlingOnLookup: RiskRule = {
  id: 'lookup-missing-error-handling',
  evaluate(formula) {
    if (formula.errorHandlingFunctions.length > 0) return [];
    const risky = formula.lookups.some((l) => ['VLOOKUP', 'HLOOKUP', 'MATCH'].includes(l.function));
    if (!risky) return [];
    return [
      {
        id: 'lookup-missing-error-handling',
        severity: 'info',
        title: 'Lookup has no fallback for "not found"',
        message:
          'When the lookup value is missing, this returns #N/A. Wrap it in IFNA(...) (or use ' +
          'XLOOKUP with its built-in "if not found" argument) to show a friendly value instead.',
      },
    ];
  },
};

const vlookupApproximateMatch: RiskRule = {
  id: 'vlookup-approximate-match',
  evaluate(formula) {
    const hit = formula.lookups.some(
      (l) => (l.function === 'VLOOKUP' || l.function === 'HLOOKUP') && l.approximateMatch === true,
    );
    if (!hit) return [];
    return [
      {
        id: 'vlookup-approximate-match',
        severity: 'warning',
        title: 'VLOOKUP is using approximate match',
        message:
          'The last argument is TRUE or omitted, so VLOOKUP returns the closest match and assumes the ' +
          'first column is sorted ascending. For an exact match, pass FALSE (or 0) as the last argument.',
      },
    ];
  },
};

const vlookupFragileIndex: RiskRule = {
  id: 'vlookup-fragile-index',
  evaluate(formula) {
    if (!formula.lookups.some((l) => l.hardcodedColumnIndex)) return [];
    return [
      {
        id: 'vlookup-fragile-index',
        severity: 'info',
        title: 'Column number is hard-coded',
        message:
          'The result column is given as a fixed number. If someone inserts or reorders columns, the ' +
          'lookup silently returns the wrong data. MATCH(...) for the column, or XLOOKUP, avoids this.',
      },
    ];
  },
};

const deepNestedIf: RiskRule = {
  id: 'deep-nested-if',
  evaluate(formula) {
    if (formula.nestedIfDepth < 3) return [];
    return [
      {
        id: 'deep-nested-if',
        severity: 'info',
        title: `IF is nested ${formula.nestedIfDepth} levels deep`,
        message:
          'Deeply nested IFs are hard to read and edit. IFS(...), or a small lookup table with ' +
          'XLOOKUP, usually expresses the same logic more clearly.',
      },
    ];
  },
};

const unsupportedFunction: RiskRule = {
  id: 'unsupported-function',
  evaluate(formula) {
    if (formula.unknownFunctions.length === 0) return [];
    return [
      {
        id: 'unsupported-function',
        severity: 'info',
        title: 'Some functions are not fully analysed yet',
        message: `${formula.unknownFunctions.join(', ')} ${
          formula.unknownFunctions.length === 1 ? 'is' : 'are'
        } outside the set this tool analyses in detail. The explanation may be less specific for ${
          formula.unknownFunctions.length === 1 ? 'it' : 'them'
        }.`,
      },
    ];
  },
};

export const RISK_RULES: readonly RiskRule[] = [
  divisionByZero,
  vlookupApproximateMatch,
  vlookupFragileIndex,
  deepNestedIf,
  fullColumnReference,
  hardcodedConstant,
  volatileFunction,
  missingErrorHandlingOnLookup,
  unsupportedFunction,
];

const SEVERITY_ORDER: Record<FormulaWarning['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/** Run every rule and return warnings ordered by severity. */
export function detectRisks(formula: StructuredFormula): FormulaWarning[] {
  const warnings = RISK_RULES.flatMap((rule) => rule.evaluate(formula));
  return warnings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
