import { collect, unwrap } from '@formula-in-action/formula-parser';
import type { BinaryExpressionNode, FormulaNode } from '@formula-in-action/formula-parser';
import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import type { DetectedKpi, KpiConfidence } from '@formula-in-action/shared-types';

const STOCK_RE = /stock|inventory|inventaire|closing|onhand|on_hand|qty|quantity/i;
const CONSUMPTION_RE = /consumption|conso|usage|demand|burn|sales|dailyuse|run.?rate/i;
const REVENUE_RE = /revenue|sales|turnover|netsales/i;
const MARGIN_RE = /margin|profit|gross/i;
const GROWTH_RE = /growth|increase|yoy|mom|delta|change|variance/i;

interface Candidate extends DetectedKpi {
  priority: number;
}

const bump = (base: KpiConfidence, hasNames: boolean): KpiConfidence => {
  if (hasNames && base === 'medium') return 'high';
  if (hasNames && base === 'low') return 'medium';
  return base;
};

/**
 * Deterministically guess whether a formula computes a well-known business KPI.
 * Conservative by design — returns `null` unless a recognizable shape or a
 * strong pair of names is present.
 */
export function detectKpi(formula: StructuredFormula): DetectedKpi | null {
  const src = (node: FormulaNode): string => formula.normalizedFormula.slice(node.start, node.end).trim();
  const names = formula.namedRanges.join(' ') + ' ' + formula.structuredReferences.join(' ');
  const candidates: Candidate[] = [];

  const divisions = collect(
    formula.ast,
    (n): n is BinaryExpressionNode => n.type === 'BinaryExpression' && n.operator === '/',
  );

  for (const div of divisions) {
    const numerator = unwrap(div.left);
    const denominator = unwrap(div.right);
    const denomText = src(denominator);

    // (a - b) / X  — margin when X === a, growth when X === b.
    if (numerator.type === 'BinaryExpression' && numerator.operator === '-') {
      const minuend = src(unwrap(numerator.left));
      const subtrahend = src(unwrap(numerator.right));
      if (denomText === minuend) {
        candidates.push({
          priority: 3,
          name: 'Gross Margin %',
          confidence: bump('medium', MARGIN_RE.test(names) || REVENUE_RE.test(names)),
          rationale: `(${minuend} − ${subtrahend}) ÷ ${minuend} is the classic margin ratio: the share of ${minuend} left after subtracting ${subtrahend}.`,
        });
      } else if (denomText === subtrahend) {
        candidates.push({
          priority: 3,
          name: 'Growth Rate %',
          confidence: bump('medium', GROWTH_RE.test(names)),
          rationale: `(${minuend} − ${subtrahend}) ÷ ${subtrahend} measures the change from ${subtrahend} to ${minuend} relative to the starting value.`,
        });
      }
    }

    // stock / consumption
    if (STOCK_RE.test(src(numerator)) && CONSUMPTION_RE.test(denomText)) {
      candidates.push({
        priority: 2,
        name: 'Stock Coverage',
        confidence: 'high',
        rationale: `${src(numerator)} ÷ ${denomText} tells you how many periods the current stock lasts at the current consumption rate.`,
      });
    }

    // profit / revenue (name-based margin)
    if (MARGIN_RE.test(src(numerator)) && REVENUE_RE.test(denomText)) {
      candidates.push({
        priority: 1,
        name: 'Gross Margin %',
        confidence: 'medium',
        rationale: `${src(numerator)} ÷ ${denomText} expresses profit as a percentage of revenue.`,
      });
    }
  }

  // a / b - 1  → growth
  const minusOne = collect(
    formula.ast,
    (n): n is BinaryExpressionNode => n.type === 'BinaryExpression' && n.operator === '-',
  ).find((n) => {
    const right = unwrap(n.right);
    const left = unwrap(n.left);
    return right.type === 'NumberLiteral' && right.value === 1 && left.type === 'BinaryExpression' && left.operator === '/';
  });
  if (minusOne) {
    candidates.push({
      priority: 2,
      name: 'Growth Rate %',
      confidence: bump('medium', GROWTH_RE.test(names)),
      rationale: 'Dividing the new value by the old value and subtracting 1 gives the percentage change.',
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.priority - a.priority || confidenceRank(b.confidence) - confidenceRank(a.confidence));
  const best = candidates[0];
  return { name: best.name, confidence: best.confidence, rationale: best.rationale };
}

function confidenceRank(c: KpiConfidence): number {
  return c === 'high' ? 2 : c === 'medium' ? 1 : 0;
}
