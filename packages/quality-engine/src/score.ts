import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import type {
  FormulaHealth,
  FormulaWarning,
  HealthDimension,
  HealthDimensionName,
  HealthPenalty,
} from '@formula-in-action/shared-types';

/**
 * Reliability dominates: a formula that silently returns the wrong number is
 * worse than one that is merely ugly or slow.
 */
const WEIGHTS: Record<HealthDimensionName, number> = {
  reliability: 0.35,
  readability: 0.25,
  maintainability: 0.25,
  performance: 0.15,
};

/**
 * Risks are already detected once, by the risk-detector. Scoring maps those
 * findings onto dimensions rather than re-deriving them, so there is only ever
 * one definition of "this formula divides without a guard".
 */
const WARNING_PENALTIES: Record<string, { dimension: HealthDimensionName; points: number }> = {
  'division-risk': { dimension: 'reliability', points: 25 },
  'vlookup-approximate-match': { dimension: 'reliability', points: 20 },
  'lookup-missing-error-handling': { dimension: 'reliability', points: 15 },
  'unsupported-function': { dimension: 'reliability', points: 10 },
  'volatile-recalculation': { dimension: 'performance', points: 20 },
  'full-column-performance': { dimension: 'performance', points: 20 },
  'deep-nested-if': { dimension: 'readability', points: 15 },
  'vlookup-fragile-index': { dimension: 'maintainability', points: 15 },
  'hardcoded-value': { dimension: 'maintainability', points: 12 },
};

const SEVERITY_MULTIPLIER = { info: 0.5, warning: 1, critical: 1.4 } as const;

/** A single repeated finding should hurt, but never annihilate a dimension alone. */
const PER_ID_CAP = 2;

const LEGACY_LOOKUPS = new Set(['VLOOKUP', 'HLOOKUP']);

/**
 * Deterministic 0-100 verdict on a formula, in four dimensions.
 *
 * Pure and reproducible: the same formula always scores the same, with no model
 * call involved. That is the point — the score is the part of the product a user
 * can trust without second-guessing an LLM.
 */
export function scoreFormula(
  structured: StructuredFormula,
  warnings: FormulaWarning[],
): FormulaHealth {
  const buckets: Record<HealthDimensionName, Map<string, HealthPenalty>> = {
    reliability: new Map(),
    readability: new Map(),
    performance: new Map(),
    maintainability: new Map(),
  };

  const add = (
    dimension: HealthDimensionName,
    id: string,
    label: string,
    points: number,
    cap: number,
  ): void => {
    const rounded = Math.round(points);
    if (rounded <= 0) return;
    const existing = buckets[dimension].get(id);
    const total = Math.min(cap, (existing?.points ?? 0) + rounded);
    buckets[dimension].set(id, { id, label, points: total });
  };

  for (const warning of warnings) {
    const mapped = WARNING_PENALTIES[warning.id];
    if (!mapped) continue;
    const points = mapped.points * SEVERITY_MULTIPLIER[warning.severity];
    add(mapped.dimension, warning.id, warning.title, points, mapped.points * PER_ID_CAP);
  }

  for (const penalty of structuralPenalties(structured)) {
    add(penalty.dimension, penalty.id, penalty.label, penalty.points, penalty.points);
  }

  const dimensions = {
    reliability: toDimension(buckets.reliability),
    readability: toDimension(buckets.readability),
    performance: toDimension(buckets.performance),
    maintainability: toDimension(buckets.maintainability),
  };

  const score = Math.round(
    (Object.keys(WEIGHTS) as HealthDimensionName[]).reduce(
      (sum, name) => sum + dimensions[name].score * WEIGHTS[name],
      0,
    ),
  );

  return { score, band: bandFor(score), dimensions };
}

interface StructuralPenalty extends HealthPenalty {
  dimension: HealthDimensionName;
}

/**
 * Quality signals the risk-detector deliberately does not raise, because they
 * are not *risks* — a long formula is not a bug, it is just hard to live with.
 */
function structuralPenalties(structured: StructuredFormula): StructuralPenalty[] {
  const penalties: StructuralPenalty[] = [];
  const length = structured.normalizedFormula.length;

  if (length > 250) {
    penalties.push({
      dimension: 'readability',
      id: 'very-long-formula',
      label: 'Very long formula',
      points: 20,
    });
  } else if (length > 120) {
    penalties.push({
      dimension: 'readability',
      id: 'long-formula',
      label: 'Long formula',
      points: 10,
    });
  }

  // Nested IFs are already covered by `deep-nested-if`; this catches depth built
  // from anything else (lookups inside aggregations inside rounding, ...).
  if (structured.maxNestingDepth > 4) {
    penalties.push({
      dimension: 'readability',
      id: 'deep-nesting',
      label: 'Deeply nested function calls',
      points: Math.min(20, (structured.maxNestingDepth - 4) * 5),
    });
  }

  if (structured.functions.length > 6) {
    penalties.push({
      dimension: 'readability',
      id: 'many-functions',
      label: 'Many different functions in one formula',
      points: 10,
    });
  }

  if (structured.functions.some((fn) => LEGACY_LOOKUPS.has(fn.name))) {
    penalties.push({
      dimension: 'maintainability',
      id: 'legacy-lookup',
      label: 'Legacy lookup function (XLOOKUP is more robust)',
      points: 10,
    });
  }

  if (structured.sheetReferences.length > 2) {
    penalties.push({
      dimension: 'maintainability',
      id: 'cross-sheet-spread',
      label: 'Reads from many different sheets',
      points: 8,
    });
  }

  return penalties;
}

function toDimension(penalties: Map<string, HealthPenalty>): HealthDimension {
  const ranked = [...penalties.values()].sort(
    (a, b) => b.points - a.points || a.id.localeCompare(b.id),
  );
  const lost = ranked.reduce((sum, penalty) => sum + penalty.points, 0);
  return { score: Math.max(0, 100 - lost), penalties: ranked };
}

function bandFor(score: number): FormulaHealth['band'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 55) return 'fair';
  return 'poor';
}
