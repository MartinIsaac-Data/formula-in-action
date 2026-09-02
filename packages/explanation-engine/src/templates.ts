import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import { getFunctionSpec } from '@formula-in-action/formula-analyzer';
import type {
  AiExplanationDraft,
  ExplanationContext,
  ExplanationStep,
  FormulaSuggestion,
  FormulaWarning,
} from '@formula-in-action/shared-types';
import type { PromptInput } from './prompt';

/**
 * Deterministic explanation used when the AI provider is unavailable or returns
 * invalid output (requirement #8 — graceful degradation). Not as fluent as the
 * model, but always correct and always available.
 */
export function buildTemplateDraft(input: PromptInput): AiExplanationDraft {
  const { structured: s } = input;
  const outer = s.functions.find((f) => f.maxDepth === 1) ?? s.functions[0];

  const summary = outer?.purpose
    ? `${outer.purpose}.`
    : s.hasDivision
      ? 'This formula divides one value by another.'
      : 'This formula combines the values and functions below to produce a single result.';

  const functionSentence = s.functions.length
    ? `It uses ${listFunctions(s)}.`
    : 'It is a direct calculation with no functions.';

  const simpleExplanation = [summary, functionSentence, referenceSentence(s)]
    .filter(Boolean)
    .join(' ');

  const technicalExplanation = buildTechnical(s);

  return {
    summary,
    simpleExplanation,
    technicalExplanation,
    steps: buildSteps(s),
    illustrativeExample: buildExample(input.context, s),
    suggestions: buildSuggestions(input.warnings),
  };
}

function listFunctions(s: StructuredFormula): string {
  const names = s.functions.map((f) => f.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function referenceSentence(s: StructuredFormula): string {
  if (!s.references.length) return '';
  const raws = s.references.map((r) => r.raw);
  const shown = raws.slice(0, 4).join(', ');
  const extra = raws.length > 4 ? `, and ${raws.length - 4} more` : '';
  const sheets = s.sheetReferences.length ? ` (including data on ${s.sheetReferences.join(', ')})` : '';
  return `It reads from ${shown}${extra}${sheets}.`;
}

function buildTechnical(s: StructuredFormula): string {
  const parts: string[] = [];
  for (const fn of s.functions) {
    const spec = getFunctionSpec(fn.name);
    parts.push(spec ? `${fn.name} — ${spec.purpose.toLowerCase()}.` : `${fn.name} — not in the analysed function set.`);
  }
  if (s.hasComparison) parts.push('A comparison test drives at least one branch.');
  if (s.hasConcatenation) parts.push('Text is joined with the & operator.');
  if (s.errorHandlingFunctions.length) {
    parts.push(`Errors are trapped by ${s.errorHandlingFunctions.join(', ')}.`);
  }
  return parts.join(' ') || 'The formula is a plain arithmetic expression.';
}

function buildSteps(s: StructuredFormula): ExplanationStep[] {
  const steps: ExplanationStep[] = [];
  // Deepest functions first, then work outward.
  const ordered = [...s.functions].sort((a, b) => b.maxDepth - a.maxDepth);
  for (const fn of ordered) {
    const spec = getFunctionSpec(fn.name);
    steps.push({
      step: steps.length + 1,
      formulaPart: `${fn.name}(...)`,
      explanation: spec ? `${spec.purpose}.` : `Apply ${fn.name}.`,
    });
  }
  if (s.hasDivision && !steps.some((step) => step.formulaPart.includes('/'))) {
    steps.push({
      step: steps.length + 1,
      formulaPart: 'a / b',
      explanation: 'Divide one value by another.',
    });
  }
  if (steps.length === 0) {
    steps.push({
      step: 1,
      formulaPart: s.normalizedFormula,
      explanation: 'Evaluate the expression to a single value.',
    });
  }
  return steps;
}

interface Scenario {
  scenario: string;
  calculation: string;
  result: string;
}

const DIVISION_SCENARIOS: Record<ExplanationContext, Scenario> = {
  everyday: {
    scenario: 'You have 30 bottles of water and drink 2 every day.',
    calculation: '30 / 2 = 15',
    result: 'The water lasts 15 days.',
  },
  business: {
    scenario: 'A team closed 120 tickets across 4 people.',
    calculation: '120 / 4 = 30',
    result: 'That is 30 tickets per person.',
  },
  finance: {
    scenario: 'You have $12,000 available and spend $2,000 each month.',
    calculation: '12000 / 2000 = 6',
    result: 'The funds cover 6 months of expenses.',
  },
  sales: {
    scenario: 'A region booked $90,000 from 3 sales reps.',
    calculation: '90000 / 3 = 30000',
    result: 'Each rep averaged $30,000.',
  },
  'supply-chain': {
    scenario: 'A warehouse holds 1,000 cartons and ships 200 each month.',
    calculation: '1000 / 200 = 5',
    result: 'Current stock covers 5 months.',
  },
  hr: {
    scenario: 'A department has a $600,000 salary budget across 10 roles.',
    calculation: '600000 / 10 = 60000',
    result: 'The average budgeted salary is $60,000.',
  },
  education: {
    scenario: 'A class scored 850 total points across 20 students.',
    calculation: '850 / 20 = 42.5',
    result: 'The class average is 42.5 points.',
  },
};

const GENERIC_SCENARIOS: Record<ExplanationContext, Scenario> = {
  everyday: {
    scenario: 'Think of sorting your weekly shopping into categories and totalling each one.',
    calculation: 'add the matching items together',
    result: 'You get one number that answers your question.',
  },
  business: {
    scenario: 'Think of a manager pulling one number out of a big activity log.',
    calculation: 'filter the rows that matter, then combine them',
    result: 'The formula returns that single number.',
  },
  finance: {
    scenario: 'Think of reconciling a statement down to one figure.',
    calculation: 'select the relevant entries, then total or compare them',
    result: 'The formula gives you that figure.',
  },
  sales: {
    scenario: 'Think of a rep checking their number for one region and month.',
    calculation: 'keep the matching deals, then add them up',
    result: 'The formula returns that total.',
  },
  'supply-chain': {
    scenario: 'Think of a planner checking one product at one site.',
    calculation: 'keep the matching movements, then combine them',
    result: 'The formula returns that quantity.',
  },
  hr: {
    scenario: 'Think of counting the people who match a rule.',
    calculation: 'keep the matching records, then count or total them',
    result: 'The formula returns that number.',
  },
  education: {
    scenario: 'Think of a teacher tallying results for one class.',
    calculation: 'keep the matching students, then combine their scores',
    result: 'The formula returns that value.',
  },
};

function buildExample(context: ExplanationContext, s: StructuredFormula): Scenario & { title: string } {
  const base = s.hasDivision ? DIVISION_SCENARIOS[context] : GENERIC_SCENARIOS[context];
  return { title: 'Formula in Action', ...base };
}

function buildSuggestions(warnings: FormulaWarning[]): FormulaSuggestion[] {
  const suggestions: FormulaSuggestion[] = [];
  for (const w of warnings) {
    if (w.id === 'division-risk') {
      suggestions.push({
        id: 'wrap-iferror',
        title: 'Guard the division against errors',
        rationale:
          'Wrapping the division in IFERROR keeps the sheet readable when the denominator is blank or zero.',
        suggestedFormula: w.formulaPart ? `=IFERROR(${w.formulaPart}, 0)` : undefined,
      });
    }
    if (w.id === 'vlookup-fragile-index') {
      suggestions.push({
        id: 'use-xlookup',
        title: 'Switch to XLOOKUP',
        rationale:
          'XLOOKUP matches by column contents instead of a fixed number, so it survives inserted or reordered columns.',
      });
    }
  }
  return suggestions;
}
