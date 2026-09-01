/**
 * Token and AST type definitions for the Excel formula parser.
 *
 * The AST is intentionally analysis-oriented (not evaluation-oriented): it keeps
 * enough structure to describe what a formula does, and preserves source spans
 * (`start`/`end`, 0-based offsets into {@link ParsedFormula.source}).
 */

export type TokenType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'error'
  | 'function'
  | 'name'
  | 'ref'
  | 'structured-ref'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'lbrace'
  | 'rbrace'
  | 'comma'
  | 'semicolon'
  | 'eof';

export interface Token {
  type: TokenType;
  /** Normalized text (e.g. sheet quotes removed, function name kept as written). */
  value: string;
  start: number;
  end: number;
}

export interface SourceSpan {
  start: number;
  end: number;
}

export type NodeType =
  | 'NumberLiteral'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'ErrorLiteral'
  | 'ArrayLiteral'
  | 'Reference'
  | 'Range'
  | 'NamedReference'
  | 'StructuredReference'
  | 'FunctionCall'
  | 'UnaryExpression'
  | 'PostfixExpression'
  | 'BinaryExpression'
  | 'ParenthesizedExpression'
  | 'EmptyArgument';

export interface NumberLiteralNode extends SourceSpan {
  type: 'NumberLiteral';
  value: number;
  raw: string;
}

export interface StringLiteralNode extends SourceSpan {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteralNode extends SourceSpan {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface ErrorLiteralNode extends SourceSpan {
  type: 'ErrorLiteral';
  value: string;
}

export interface ArrayLiteralNode extends SourceSpan {
  type: 'ArrayLiteral';
  rows: FormulaNode[][];
}

export type ReferenceKind = 'cell' | 'column' | 'row';

export interface ReferenceNode extends SourceSpan {
  type: 'Reference';
  kind: ReferenceKind;
  /** Sheet name without quotes, or `undefined` for a workbook-local reference. */
  sheet?: string;
  /** Second sheet name for a 3-D reference (`Jan:Dec!A1`). */
  sheetTo?: string;
  raw: string;
  column?: string;
  endColumn?: string;
  row?: string;
  endRow?: string;
  absoluteColumn: boolean;
  absoluteRow: boolean;
}

export interface RangeNode extends SourceSpan {
  type: 'Range';
  sheet?: string;
  sheetTo?: string;
  raw: string;
  from: ReferenceNode;
  to: ReferenceNode;
}

export interface NamedReferenceNode extends SourceSpan {
  type: 'NamedReference';
  name: string;
  sheet?: string;
}

export interface StructuredReferenceNode extends SourceSpan {
  type: 'StructuredReference';
  table?: string;
  raw: string;
}

export interface FunctionCallNode extends SourceSpan {
  type: 'FunctionCall';
  /** Upper-cased function name. */
  name: string;
  args: FormulaNode[];
}

export type UnaryOperator = '-' | '+';

export interface UnaryExpressionNode extends SourceSpan {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  operand: FormulaNode;
}

export interface PostfixExpressionNode extends SourceSpan {
  type: 'PostfixExpression';
  operator: '%';
  operand: FormulaNode;
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | '&'
  | '='
  | '<>'
  | '<'
  | '>'
  | '<='
  | '>=';

export interface BinaryExpressionNode extends SourceSpan {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: FormulaNode;
  right: FormulaNode;
}

export interface ParenthesizedExpressionNode extends SourceSpan {
  type: 'ParenthesizedExpression';
  expression: FormulaNode;
}

/** Placeholder for an omitted argument, e.g. the middle slot in `IF(A1,,0)`. */
export interface EmptyArgumentNode extends SourceSpan {
  type: 'EmptyArgument';
}

export type FormulaNode =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | ErrorLiteralNode
  | ArrayLiteralNode
  | ReferenceNode
  | RangeNode
  | NamedReferenceNode
  | StructuredReferenceNode
  | FunctionCallNode
  | UnaryExpressionNode
  | PostfixExpressionNode
  | BinaryExpressionNode
  | ParenthesizedExpressionNode
  | EmptyArgumentNode;

export interface ParsedFormula {
  /** Original formula with a single leading `=` removed and outer whitespace trimmed. */
  source: string;
  ast: FormulaNode;
}

/** Pluggable parser implementation. Swap the default without touching callers. */
export interface FormulaParserAdapter {
  readonly name: string;
  parse(formula: string): ParsedFormula;
}
