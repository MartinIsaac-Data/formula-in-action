/**
 * JSON Schema for the model's output. Mirrors `AiExplanationDraftSchema` from
 * `@formula-in-action/shared-types`; kept hand-written (rather than generated)
 * so the wire shape sent to the provider is explicit and reviewable.
 */
export const AI_DRAFT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'simpleExplanation',
    'technicalExplanation',
    'steps',
    'illustrativeExample',
    'suggestions',
  ],
  properties: {
    summary: { type: 'string', minLength: 1 },
    simpleExplanation: { type: 'string', minLength: 1 },
    technicalExplanation: { type: 'string', minLength: 1 },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['step', 'formulaPart', 'explanation'],
        properties: {
          step: { type: 'integer', minimum: 1 },
          formulaPart: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
    illustrativeExample: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'scenario', 'calculation', 'result'],
      properties: {
        title: { type: 'string' },
        scenario: { type: 'string' },
        calculation: { type: 'string' },
        result: { type: 'string' },
      },
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'rationale'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          rationale: { type: 'string' },
          suggestedFormula: { type: 'string' },
        },
      },
    },
  },
};
