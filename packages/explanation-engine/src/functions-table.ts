import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import { getFunctionSpec } from '@formula-in-action/formula-analyzer';
import type { ExplanationFunction } from '@formula-in-action/shared-types';

/**
 * The "Functions Used" table (requirement #3E) — built deterministically from
 * the analyzer, never from the model.
 */
export function buildFunctionsTable(formula: StructuredFormula): ExplanationFunction[] {
  return formula.functions.map((used) => {
    const spec = getFunctionSpec(used.name);
    const entry: ExplanationFunction = {
      name: used.name,
      purpose: spec?.purpose ?? 'Not in the analysed function set — see Potential Issues.',
    };
    if (spec?.detail) entry.detail = spec.detail;
    return entry;
  });
}
