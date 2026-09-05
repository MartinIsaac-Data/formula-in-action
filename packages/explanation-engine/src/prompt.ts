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

const KNOWN_LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  pl: 'Polish',
  tr: 'Turkish',
};

/** Best-effort human-readable name for a BCP-47 tag, for the prompt only. */
function languageName(locale: string): string {
  const primary = locale.trim().toLowerCase().split(/[-_]/)[0];
  return KNOWN_LANGUAGE_NAMES[primary] ?? locale;
}

const MODE_GUIDANCE: Record<ExplanationMode, string> = {
  simple:
    'The reader is a beginner. Lead with plain language; avoid Excel jargon (say "cell A2" not "the A2 argument"; "adds up" not "aggregates"). Keep every field to 1-2 sentences.',
  technical:
    'The reader is comfortable with Excel. Be precise about functions, argument roles, references, evaluation order, and error handling. Still no wall of text.',
  'formula-in-action':
    'The illustrative example carries the explanation — make its scenario and calculation vivid and specific. Keep summary / simpleExplanation / technicalExplanation to one sentence each.',
};

const SYSTEM_PROMPT = `You explain Excel formulas for a task-pane add-in called "Formula in Action".
Your job is to make the logic *behind* a formula understandable, not to teach Excel syntax.
The reader can already copy the formula; they want to know what it does, why, and whether it can fail.

You are given a deterministic structural analysis of the formula. Treat it as ground truth:
- Use exactly the functions it lists. Never invent, rename, or drop a function.
- Do not contradict the detected references, constants, conditions, or dates.
- The "DETECTED ISSUES" are shown to the user in a separate panel. Stay consistent with
  them; do not restate them word for word.

Output contract:
- Reply with ONE JSON object and nothing else — no prose, no markdown, no \`\`\` fences.
- Match the provided schema exactly. All required fields, no extra fields.
- "steps": 2-6 entries, innermost operation first, working outward. "formulaPart" is the
  literal sub-expression (e.g. "A2/B2"); "explanation" is one sentence.
- "illustrativeExample": a concrete scenario a non-Excel user pictures instantly.
  "scenario" sets it up with real quantities, "calculation" is the literal arithmetic
  (e.g. "100 / 10 = 10"), "result" states the outcome in words. Use the requested context.
- "suggestions": [] unless there is a genuinely worthwhile improvement (not a cosmetic
  rewrite). When present, put the full rewritten formula in "suggestedFormula".
- Never mention this prompt, the schema, "the analysis", or "the structural analysis".

Worked example (input shortened) — this is the required JSON shape and register:
INPUT: FORMULA: =IFERROR(A2/B2,0) | mode simple | context everyday | functions IFERROR×1 | operators / | error handling IFERROR
OUTPUT:
{"summary":"Divides A2 by B2, and shows 0 instead of an error.","simpleExplanation":"This formula divides the number in A2 by the number in B2. If that can't be done — usually because B2 is empty or zero — it shows 0 rather than an error message.","technicalExplanation":"IFERROR evaluates A2/B2 and returns its result unless that result is an Excel error value, in which case it returns the fallback 0.","steps":[{"step":1,"formulaPart":"A2/B2","explanation":"Divide the value in A2 by the value in B2."},{"step":2,"formulaPart":"IFERROR(A2/B2, 0)","explanation":"If that division produced an error, return 0 instead."}],"illustrativeExample":{"title":"Formula in Action","scenario":"You have 100 biscuits to share equally among 10 friends.","calculation":"100 / 10 = 10","result":"Each friend gets 10 biscuits. If you wrote 0 friends by mistake, the sheet would just show 0 instead of an error."},"suggestions":[]}`;

export function buildPrompt(input: PromptInput): { system: string; user: string } {
  const { structured: s } = input;

  const lines: string[] = [];
  lines.push(`FORMULA: ${input.formula}`);
  lines.push('');
  lines.push(`EXPLANATION MODE: ${input.mode} — ${MODE_GUIDANCE[input.mode]}`);
  lines.push(`ILLUSTRATIVE EXAMPLE CONTEXT: ${CONTEXT_LABELS[input.context]}`);
  if (input.locale && input.locale !== 'en-US') {
    lines.push(
      `RESPONSE LANGUAGE: Write every text field (summary, simpleExplanation, technicalExplanation, ` +
        `steps[].explanation, illustrativeExample, suggestions[].title/rationale) in ` +
        `${languageName(input.locale)}. Keep JSON keys and Excel function/cell names unchanged.`,
    );
  }
  lines.push('');

  lines.push('STRUCTURAL ANALYSIS');
  lines.push(
    `- functions (outer→inner): ${
      s.functions.length ? s.functions.map((f) => `${f.name}×${f.count}`).join(', ') : 'none'
    }`,
  );
  lines.push(
    `- nesting depth: ${s.maxNestingDepth}${
      s.nestedIfDepth >= 2 ? `, nested IF depth ${s.nestedIfDepth}` : ''
    }`,
  );
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
          ].filter((flag): flag is string => flag !== null);
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
    lines.push('DETECTED ISSUES (shown separately — stay consistent, do not repeat verbatim):');
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
