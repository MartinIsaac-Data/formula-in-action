import { traverse } from '@formula-in-action/formula-parser';
import type { BinaryExpressionNode, FormulaNode } from '@formula-in-action/formula-parser';
import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import type { FormulaWarning } from '@formula-in-action/shared-types';

export interface RiskRule {
  id: string;
  /** Returns zero or more warnings. Must be pure and deterministic. */
  evaluate(formula: StructuredFormula): FormulaWarning[];
}

/** Slice the source text covered by an AST node. */
export function sourceOf(formula: StructuredFormula, node: FormulaNode): string {
  return formula.normalizedFormula.slice(node.start, node.end);
}

/** First binary expression matching `operator`, if any. */
export function findBinary(
  formula: StructuredFormula,
  operator: BinaryExpressionNode['operator'],
): BinaryExpressionNode | undefined {
  let found: BinaryExpressionNode | undefined;
  traverse(formula.ast, (node) => {
    if (!found && node.type === 'BinaryExpression' && node.operator === operator) {
      found = node;
    }
  });
  return found;
}
