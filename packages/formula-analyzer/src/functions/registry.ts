/**
 * Declarative registry of the Excel functions the MVP understands
 * (requirement #13). Adding support for a new function = adding one record here;
 * no engine change required.
 */

export type FunctionCategory =
  | 'math'
  | 'aggregation'
  | 'logical'
  | 'lookup'
  | 'text'
  | 'date'
  | 'error-handling'
  | 'information';

/** Sentinel for a variadic function (`SUM`, `CONCAT`, ...). */
export const VARIADIC = 255;

export interface FunctionSpec {
  name: string;
  category: FunctionCategory;
  minArgs: number;
  maxArgs: number;
  /** One line, used directly in the "Functions Used" table. */
  purpose: string;
  /** Longer explanation, shown when the user expands the function row. */
  detail?: string;
  /** Positional argument labels, used to describe the step breakdown. */
  argRoles?: string[];
  volatile?: boolean;
}

const SPECS: FunctionSpec[] = [
  {
    name: 'SUM',
    category: 'aggregation',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Adds up numbers',
    detail: 'Adds all the numbers in the ranges or values you give it.',
  },
  {
    name: 'AVERAGE',
    category: 'aggregation',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Calculates the mean of numbers',
    detail: 'Adds the numbers and divides by how many there are, ignoring empty cells.',
  },
  {
    name: 'COUNT',
    category: 'aggregation',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Counts cells that contain numbers',
  },
  {
    name: 'COUNTIF',
    category: 'aggregation',
    minArgs: 2,
    maxArgs: 2,
    purpose: 'Counts cells that meet one condition',
    argRoles: ['range', 'criteria'],
  },
  {
    name: 'COUNTIFS',
    category: 'aggregation',
    minArgs: 2,
    maxArgs: VARIADIC,
    purpose: 'Counts cells that meet several conditions',
    argRoles: ['criteria range', 'criteria'],
  },
  {
    name: 'SUMIF',
    category: 'aggregation',
    minArgs: 2,
    maxArgs: 3,
    purpose: 'Adds values that meet one condition',
    argRoles: ['range', 'criteria', 'sum range'],
  },
  {
    name: 'SUMIFS',
    category: 'aggregation',
    minArgs: 3,
    maxArgs: VARIADIC,
    purpose: 'Adds values that meet several conditions',
    argRoles: ['sum range', 'criteria range', 'criteria'],
  },
  {
    name: 'IF',
    category: 'logical',
    minArgs: 2,
    maxArgs: 3,
    purpose: 'Chooses between two outcomes based on a test',
    argRoles: ['test', 'value if true', 'value if false'],
  },
  {
    name: 'IFS',
    category: 'logical',
    minArgs: 2,
    maxArgs: VARIADIC,
    purpose: 'Checks several conditions in order and returns the first match',
    argRoles: ['test', 'value if true'],
  },
  {
    name: 'IFERROR',
    category: 'error-handling',
    minArgs: 2,
    maxArgs: 2,
    purpose: 'Returns a fallback value when a calculation errors',
    argRoles: ['value', 'value if error'],
  },
  {
    name: 'VLOOKUP',
    category: 'lookup',
    minArgs: 3,
    maxArgs: 4,
    purpose: 'Looks up a value in the first column of a table',
    argRoles: ['lookup value', 'table', 'column number', 'match type'],
  },
  {
    name: 'XLOOKUP',
    category: 'lookup',
    minArgs: 3,
    maxArgs: 6,
    purpose: 'Looks up a value and returns a matching result, with a built-in fallback',
    argRoles: ['lookup value', 'lookup array', 'return array', 'if not found', 'match mode', 'search mode'],
  },
  {
    name: 'INDEX',
    category: 'lookup',
    minArgs: 2,
    maxArgs: 4,
    purpose: 'Returns the value at a given position in a range',
    argRoles: ['array', 'row number', 'column number'],
  },
  {
    name: 'MATCH',
    category: 'lookup',
    minArgs: 2,
    maxArgs: 3,
    purpose: 'Returns the position of a value within a range',
    argRoles: ['lookup value', 'lookup array', 'match type'],
  },
  {
    name: 'AND',
    category: 'logical',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'True only when every condition is true',
  },
  {
    name: 'OR',
    category: 'logical',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'True when at least one condition is true',
  },
  {
    name: 'ROUND',
    category: 'math',
    minArgs: 2,
    maxArgs: 2,
    purpose: 'Rounds a number to a set number of decimal places',
    argRoles: ['number', 'digits'],
  },
  {
    name: 'DATE',
    category: 'date',
    minArgs: 3,
    maxArgs: 3,
    purpose: 'Builds a date from a year, month, and day',
    argRoles: ['year', 'month', 'day'],
  },
  {
    name: 'TODAY',
    category: 'date',
    minArgs: 0,
    maxArgs: 0,
    purpose: "Returns today's date",
    volatile: true,
  },
  {
    name: 'LEFT',
    category: 'text',
    minArgs: 1,
    maxArgs: 2,
    purpose: 'Takes characters from the start of some text',
    argRoles: ['text', 'number of characters'],
  },
  {
    name: 'RIGHT',
    category: 'text',
    minArgs: 1,
    maxArgs: 2,
    purpose: 'Takes characters from the end of some text',
    argRoles: ['text', 'number of characters'],
  },
  {
    name: 'MID',
    category: 'text',
    minArgs: 3,
    maxArgs: 3,
    purpose: 'Takes characters from the middle of some text',
    argRoles: ['text', 'start position', 'number of characters'],
  },
  {
    name: 'CONCAT',
    category: 'text',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Joins text values together',
  },
  {
    name: 'TEXT',
    category: 'text',
    minArgs: 2,
    maxArgs: 2,
    purpose: 'Formats a number as text using a format code',
    argRoles: ['value', 'format code'],
  },
  {
    name: 'MAX',
    category: 'aggregation',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Returns the largest number',
  },
  {
    name: 'MIN',
    category: 'aggregation',
    minArgs: 1,
    maxArgs: VARIADIC,
    purpose: 'Returns the smallest number',
  },
];

export const FUNCTION_REGISTRY: ReadonlyMap<string, FunctionSpec> = new Map(
  SPECS.map((spec) => [spec.name, spec]),
);

export function getFunctionSpec(name: string): FunctionSpec | undefined {
  return FUNCTION_REGISTRY.get(name.toUpperCase());
}

/**
 * Volatile functions recalculate on every workbook change. Detected even when
 * not in the MVP registry so the risk detector can warn about performance.
 */
export const VOLATILE_FUNCTIONS: ReadonlySet<string> = new Set([
  'TODAY',
  'NOW',
  'RAND',
  'RANDBETWEEN',
  'RANDARRAY',
  'OFFSET',
  'INDIRECT',
  'INFO',
  'CELL',
]);

/** Functions that trap or test for errors. */
export const ERROR_HANDLING_FUNCTIONS: ReadonlySet<string> = new Set([
  'IFERROR',
  'IFNA',
  'ISERROR',
  'ISERR',
  'ISNA',
]);
