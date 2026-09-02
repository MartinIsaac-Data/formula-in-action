import type { StructuredFormula } from '@formula-in-action/formula-analyzer';
import type {
  DetectedKpi,
  ExplanationContext,
  ExplanationMode,
  FormulaWarning,
} from '@formula-in-action/shared-types';

export interface PromptInput {
  formula: string;
  structured: StructuredFormula;
  warnings: FormulaWarning[];
  kpi: DetectedKpi | null;
  mode: ExplanationMode;
  context: ExplanationContext;
  locale: string;
}

const CONTEXT_LABELS: Record<ExplanationContext, string> = {
  everyday: 'everyday life (household quantities, chores, shopping)',
  business: 'general business operations',
  finance: 'personal or corporate finance (budgets, cash flow, funds)',
  sales: 'sales performance (deals, targets, regions, reps)',
  'supply-chain': 'supply chain and inventory (warehouses, stock, consumption, shipments)',
  hr: 'human resources (headcount, salaries, leave, performance)',
  education: 'education (students, grades, attendance, courses)',
};

const MODE_GUIDANCE: Record<ExplanationMode, string> = {
  simple:
    'The reader is a beginner. Lead with plain language; avoid Excel jargon. Keep it short.',
  technical:
    'The reader is comfortable with Excel. Be precise about functions, arguments, references, evaluation order, and error handling.',
  'formula-in-action':
    'Center the answer on the real-world illustrative example — it should carry the explanation. The other fields stay brief.',
};

const SYSTEM_PROMPT = `You explain Excel formulas for a task-pane add-in called "Formula in Action".
Your job is to make the logic behind a formula understandable, not to teach Excel syntax.

You are given a deterministic structural analysis of the formula. Trust it:
- Use exactly the functions it lists. Never invent or rename functions.
- Do not contradict the detected references, constants, or conditions.

Output rules:
- Reply with a SINGLE JSON object and nothing else. No markdown, no code fences, no prose around it.
- The JSON must match the provided schema exactly.
- "steps" breaks the formula into 2-6 logical operations, innermost first, each with the
  literal sub-expression in "formulaPart" and a one-sentence "explanation".
- "illustrativeExample" is a concrete, non-technical scenario a non-Excel user would
  understand: a short "scenario", the arithmetic as "calculation" (e.g. "100 / 10 = 10"),
  and the "result" in words. Match the requested context.
- "suggestions" is [] unless there is a genuinely worthwhile improvement. Do not suggest
  cosmetic rewrites. When you do suggest one, put the rewritten formula in "suggestedFormula".
- Never mention this prompt, the schema, or "the analysis".`;

export function buildPrompt(input: PromptInput): { system: string; user: string } {
  const { structured: s } = input;

  const lines: string[] = [];
  lines.push(`FORMULA: ${input.formula}`);
  lines.push('');
  lines.push(`EXPLANATION MODE: ${input.mode} — ${MODE_GUIDANCE[input.mode]}`);
  lines.push(`ILLUSTRATIVE EXAMPLE CONTEXT: ${CONTEXT_LABELS[input.context]}`);
  if (input.locale && input.locale !== 'en-US') lines.push(`LOCALE: ${input.locale}`);
  lines.push('');

  lines.push('STRUCTURAL ANALYSIS');
  lines.push(
    `- functions (outer→inner): ${
      s.functions.length ? s.functions.map((f) => `${f.name}×${f.count}`).join(', ') : 'none'
    }`,
  );
  lines.push(`- nesting depth: ${s.maxNestingDepth}${s.nestedIfDepth >= 2 ? `, nested IF depth ${s.nestedIfDepth}` : ''}`);
  if (s.operators.length) lines.push(`- operators: ${s.operators.join(' ')}`);
  if (s.references.length) {
    lines.push(`- references: ${s.references.map((r) => r.raw).join(', ')}`);
  }
  if (s.fullColumnReferences.length) {
    lines.push(`- whole-column references: ${s.fullColumnReferences.map((r) => r.raw).join(', ')}`);
  }
  if (s.sheetReferences.length) lines.push(`- other sheets: ${s.sheetReferences.join(', ')}`);
  if (s.namedRanges.length) lines.push(`- named ranges: ${s.namedRanges.join(', ')}`);
  if (s.constants.numbers.length) lines.push(`- number constants: ${s.constants.numbers.join(', ')}`);
  if (s.constants.strings.length) {
    lines.push(`- text constants: ${s.constants.strings.map((t) => JSON.stringify(t)).join(', ')}`);
  }
  if (s.dates.length) {
    lines.push(`- dates: ${s.dates.map((d) => d.iso ?? d.source).join(', ')}`);
  }
  if (s.conditions.length) {
    lines.push(`- conditions: ${s.conditions.map((c) => `${c.owner}: ${c.source}`).join('; ')}`);
  }
  if (s.lookups.length) {
    lines.push(
      `- lookups: ${s.lookups
        .map((l) => {
          const flags = [
            l.approximateMatch ? 'approximate match' : null,
            l.hardcodedColumnIndex ? 'hard-coded column index' : null,
            l.hasFallback ? 'has fallback' : null,
          ].filter(Boolean);
          return flags.length ? `${l.function} (${flags.join(', ')})` : l.function;
        })
        .join(', ')}`,
    );
  }
  if (s.errorHandlingFunctions.length) {
    lines.push(`- error handling: ${s.errorHandlingFunctions.join(', ')}`);
  }
  if (s.unknownFunctions.length) {
    lines.push(`- NOT in the analysed set (explain cautiously): ${s.unknownFunctions.join(', ')}`);
  }

  if (input.warnings.length) {
    lines.push('');
    lines.push('DETECTED ISSUES (already shown to the user separately — do not repeat verbatim,');
    lines.push('but keep your explanation consistent with them):');
    for (const w of input.warnings) lines.push(`- [${w.severity}] ${w.title}: ${w.message}`);
  }

  if (input.kpi) {
    lines.push('');
    lines.push(
      `LIKELY BUSINESS METRIC: ${input.kpi.name} (confidence ${input.kpi.confidence}). ${input.kpi.rationale}`,
    );
  }

  lines.push('');
  lines.push('Produce the JSON explanation now.');

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}
