/**
 * Requirement #17 acceptance matrix.
 *
 * For each initial test formula the brief asks us to verify six things:
 *   1. correct formula detection      4. logical step breakdown
 *   2. correct functions detection    5. useful real-world example
 *   3. a correct explanation          6. potential-issue detection
 *
 * The engine is run with a forced-failure provider so every field is produced
 * deterministically (template path) and the assertions are stable.
 */
import { analyzeFormula } from '@formula-in-action/formula-analyzer';
import {
  AiExplanationDraftSchema,
  ExplanationResultSchema,
  type ExplanationContext,
} from '@formula-in-action/shared-types';
import { explainFormula, FailingProvider } from '@formula-in-action/explanation-engine';
import { describe, expect, it } from 'vitest';

interface Case {
  name: string;
  formula: string;
  functions: string[];
  /** Warning ids that must appear. */
  warnings: string[];
  /** Warning ids that must NOT appear. */
  noWarnings: string[];
  /** Substring the deterministic explanation should contain (case-insensitive). */
  explanationHint: RegExp;
}

const CASES: Case[] = [
  {
    name: 'Test 1 — =SUM(A1:A10)',
    formula: '=SUM(A1:A10)',
    functions: ['SUM'],
    warnings: [],
    noWarnings: ['division-risk', 'full-column-performance'],
    explanationHint: /add/i,
  },
  {
    name: 'Test 2 — =IF(A1>100,"High","Low")',
    formula: '=IF(A1>100,"High","Low")',
    functions: ['IF'],
    warnings: [],
    noWarnings: ['deep-nested-if'],
    explanationHint: /(choose|test|outcome)/i,
  },
  {
    name: 'Test 3 — =IFERROR(A2/B2,0)',
    formula: '=IFERROR(A2/B2,0)',
    functions: ['IFERROR'],
    warnings: [],
    noWarnings: ['division-risk'],
    explanationHint: /(error|fallback)/i,
  },
  {
    name: 'Test 4 — =SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))',
    formula: '=SUMIFS(C:C,A:A,A2,B:B,">="&DATE(2026,1,1))',
    functions: ['DATE', 'SUMIFS'],
    warnings: ['full-column-performance'],
    noWarnings: ['division-risk'],
    explanationHint: /(add|condition)/i,
  },
  {
    name: 'Test 5 — =XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")',
    formula: '=XLOOKUP(A2,Sheet2!A:A,Sheet2!B:B,"Not Found")',
    functions: ['XLOOKUP'],
    warnings: ['full-column-performance'],
    noWarnings: ['lookup-missing-error-handling', 'vlookup-approximate-match'],
    explanationHint: /look/i,
  },
  {
    name: 'Test 6 — =ROUND(AVERAGE(B2:B12),2)',
    formula: '=ROUND(AVERAGE(B2:B12),2)',
    functions: ['AVERAGE', 'ROUND'],
    warnings: [],
    noWarnings: ['full-column-performance', 'division-risk'],
    explanationHint: /(round|average|mean)/i,
  },
];

describe.each(CASES)('$name', (testCase) => {
  it('1 — detects the formula', () => {
    const structured = analyzeFormula(testCase.formula);
    expect(structured.normalizedFormula).toBe(testCase.formula.slice(1));
  });

  it('2 — detects exactly the expected functions', () => {
    const structured = analyzeFormula(testCase.formula);
    expect(structured.functions.map((f) => f.name).sort()).toEqual([...testCase.functions].sort());
  });

  it('3-6 — produces a complete, schema-valid explanation', async () => {
    const result = await explainFormula(
      { formula: testCase.formula, mode: 'simple', context: 'business', locale: 'en-US', sheetNames: [], namedRanges: [] },
      { provider: new FailingProvider(), now: () => new Date('2026-09-02T00:00:00Z') },
    );

    expect(() => ExplanationResultSchema.parse(result)).not.toThrow();

    // 3 — a correct explanation
    expect(result.simpleExplanation).toMatch(testCase.explanationHint);
    // 4 — logical step breakdown
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    expect(result.steps.map((s) => s.step)).toEqual(result.steps.map((_s, i) => i + 1));
    // 5 — useful real-world example
    const ex = result.illustrativeExample;
    for (const field of [ex.title, ex.scenario, ex.calculation, ex.result]) {
      expect(field.trim().length).toBeGreaterThan(0);
    }
    // 6 — potential issues
    const ids = result.warnings.map((w) => w.id);
    for (const id of testCase.warnings) expect(ids).toContain(id);
    for (const id of testCase.noWarnings) expect(ids).not.toContain(id);
  });
});

describe('illustrative example — every context is covered', () => {
  const CONTEXTS: ExplanationContext[] = [
    'everyday',
    'business',
    'finance',
    'sales',
    'supply-chain',
    'hr',
    'education',
  ];

  it.each(CONTEXTS)('%s produces a schema-valid draft with a filled example', async (context) => {
    const result = await explainFormula(
      { formula: '=Stock/Consumption', mode: 'formula-in-action', context, locale: 'en-US', sheetNames: [], namedRanges: [] },
      { provider: new FailingProvider() },
    );
    expect(() =>
      AiExplanationDraftSchema.parse({
        summary: result.summary,
        simpleExplanation: result.simpleExplanation,
        technicalExplanation: result.technicalExplanation,
        steps: result.steps,
        illustrativeExample: result.illustrativeExample,
        suggestions: result.suggestions,
      }),
    ).not.toThrow();
    expect(result.illustrativeExample.calculation.trim().length).toBeGreaterThan(0);
  });
});
