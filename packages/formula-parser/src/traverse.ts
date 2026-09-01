import type { FormulaNode } from './types';

export type Visitor = (node: FormulaNode, ancestors: readonly FormulaNode[]) => void;

/** Depth-first pre-order walk of the AST. `ancestors` is outermost-first. */
export function traverse(root: FormulaNode, visit: Visitor): void {
  const walk = (node: FormulaNode, ancestors: FormulaNode[]): void => {
    visit(node, ancestors);
    const next = [...ancestors, node];
    switch (node.type) {
      case 'ArrayLiteral':
        for (const row of node.rows) for (const cell of row) walk(cell, next);
        break;
      case 'Range':
        walk(node.from, next);
        walk(node.to, next);
        break;
      case 'FunctionCall':
        for (const arg of node.args) walk(arg, next);
        break;
      case 'UnaryExpression':
      case 'PostfixExpression':
        walk(node.operand, next);
        break;
      case 'BinaryExpression':
        walk(node.left, next);
        walk(node.right, next);
        break;
      case 'ParenthesizedExpression':
        walk(node.expression, next);
        break;
      default:
        break;
    }
  };
  walk(root, []);
}

/** Collect every node for which `predicate` returns true. */
export function collect<T extends FormulaNode>(
  root: FormulaNode,
  predicate: (node: FormulaNode) => node is T,
): T[] {
  const found: T[] = [];
  traverse(root, (node) => {
    if (predicate(node)) found.push(node);
  });
  return found;
}

/** Unwrap `ParenthesizedExpression` layers to get at the meaningful node. */
export function unwrap(node: FormulaNode): FormulaNode {
  let current = node;
  while (current.type === 'ParenthesizedExpression') current = current.expression;
  return current;
}
