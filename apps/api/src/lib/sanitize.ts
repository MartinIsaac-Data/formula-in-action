/**
 * C0/C1 control characters, keeping tab (0x09), newline (0x0A) and CR (0x0D)
 * since Excel permits line breaks inside a formula.
 */
const CONTROL_CHARS = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]',
  'g',
);

/** Remove control characters and outer whitespace from a formula before analysis. */
export function sanitizeFormula(formula: string): string {
  return formula.replace(CONTROL_CHARS, '').trim();
}
