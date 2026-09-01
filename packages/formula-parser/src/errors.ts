/** Thrown when a formula cannot be tokenized or parsed. */
export class FormulaParseError extends Error {
  readonly position: number;
  readonly source: string;

  constructor(message: string, position: number, source: string) {
    super(message);
    this.name = 'FormulaParseError';
    this.position = position;
    this.source = source;
  }
}
