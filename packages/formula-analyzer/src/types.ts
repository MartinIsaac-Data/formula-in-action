import type { FormulaNode } from '@formula-in-action/formula-parser';
import type { FunctionCategory } from './functions/registry';

export interface DetectedFunctionUse {
  name: string;
  /** Number of call sites of this function in the formula. */
  count: number;
  /** True when the function is in the MVP registry. */
  known: boolean;
  category?: FunctionCategory;
  purpose?: string;
  detail?: string;
  argRoles?: string[];
  /** Argument count observed at each call site. */
  argCounts: number[];
  /** Deepest nesting level (root call = 1) at which this function appears. */
  maxDepth: number;
}

export type ReferenceShape = 'cell' | 'column' | 'row' | 'range';

export interface ReferenceSummary {
  raw: string;
  shape: ReferenceShape;
  sheet?: string;
  isFullColumn: boolean;
  isFullRow: boolean;
  isAbsolute: boolean;
}

export type ConditionKind = 'comparison' | 'criteria-string' | 'boolean-logic';

export interface ConditionSummary {
  /** The source text of the condition. */
  source: string;
  kind: ConditionKind;
  /** The comparison operator, when `kind === 'comparison'`. */
  operator?: string;
  /** The function that owns this condition (`IF`, `SUMIFS`, `AND`, ...). */
  owner: string;
}

export interface LookupSummary {
  function: string;
  approximateMatch?: boolean;
  hardcodedColumnIndex?: boolean;
  hasFallback?: boolean;
}

export interface ConstantSummary {
  numbers: number[];
  strings: string[];
  booleans: boolean[];
}

export interface DateSummary {
  /** Source text, e.g. `DATE(2026,9,1)`. */
  source: string;
  /** ISO date when all three arguments are numeric literals, else `undefined`. */
  iso?: string;
}

/**
 * The deterministic, fully reproducible description of a formula. This — not the
 * raw string — is what the explanation engine turns into an AI prompt.
 */
export interface StructuredFormula {
  formula: string;
  normalizedFormula: string;
  ast: FormulaNode;

  functions: DetectedFunctionUse[];
  unknownFunctions: string[];
  volatileFunctions: string[];
  errorHandlingFunctions: string[];

  maxNestingDepth: number;
  nestedIfDepth: number;

  operators: string[];
  hasArithmetic: boolean;
  hasComparison: boolean;
  hasConcatenation: boolean;
  hasDivision: boolean;

  references: ReferenceSummary[];
  fullColumnReferences: ReferenceSummary[];
  fullRowReferences: ReferenceSummary[];
  sheetReferences: string[];
  namedRanges: string[];
  structuredReferences: string[];

  constants: ConstantSummary;
  dates: DateSummary[];
  errorLiterals: string[];

  conditions: ConditionSummary[];
  lookups: LookupSummary[];
}
