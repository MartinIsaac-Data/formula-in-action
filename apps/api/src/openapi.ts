import { MAX_FORMULA_LENGTH } from '@formula-in-action/shared-types';

/** Hand-written schemas for Fastify route validation + OpenAPI docs. */

export const explainRequestSchema = {
  $id: 'ExplainRequest',
  type: 'object',
  additionalProperties: false,
  required: ['formula'],
  properties: {
    // Upper bound is enforced by the route handler (code: formula_too_long) and
    // by ExplainRequestSchema, so the more specific error wins over Ajv's.
    formula: { type: 'string', minLength: 1, maxLength: MAX_FORMULA_LENGTH * 4 },
    cellAddress: { type: 'string', maxLength: 64 },
    sheetNames: { type: 'array', items: { type: 'string', maxLength: 128 }, maxItems: 64 },
    namedRanges: { type: 'array', items: { type: 'string', maxLength: 128 }, maxItems: 256 },
    mode: { type: 'string', enum: ['simple', 'technical', 'formula-in-action'] },
    context: {
      type: 'string',
      enum: ['everyday', 'business', 'finance', 'sales', 'supply-chain', 'hr', 'education'],
    },
    locale: { type: 'string', maxLength: 16 },
  },
};

const step = {
  type: 'object',
  required: ['step', 'formulaPart', 'explanation'],
  properties: {
    step: { type: 'integer', minimum: 1 },
    formulaPart: { type: 'string' },
    explanation: { type: 'string' },
  },
};

export const explanationResultSchema = {
  $id: 'ExplanationResult',
  type: 'object',
  required: [
    'formula',
    'summary',
    'simpleExplanation',
    'technicalExplanation',
    'steps',
    'functions',
    'illustrativeExample',
    'warnings',
    'suggestions',
    'meta',
  ],
  properties: {
    formula: { type: 'string' },
    summary: { type: 'string' },
    simpleExplanation: { type: 'string' },
    technicalExplanation: { type: 'string' },
    steps: { type: 'array', items: step },
    functions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'purpose'],
        properties: {
          name: { type: 'string' },
          purpose: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
    illustrativeExample: {
      type: 'object',
      required: ['title', 'scenario', 'calculation', 'result'],
      properties: {
        title: { type: 'string' },
        scenario: { type: 'string' },
        calculation: { type: 'string' },
        result: { type: 'string' },
      },
    },
    warnings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'severity', 'title', 'message'],
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
          title: { type: 'string' },
          message: { type: 'string' },
          formulaPart: { type: 'string' },
        },
      },
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'rationale'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          rationale: { type: 'string' },
          suggestedFormula: { type: 'string' },
        },
      },
    },
    detectedKpi: {
      type: ['object', 'null'],
      properties: {
        name: { type: 'string' },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        rationale: { type: 'string' },
      },
    },
    meta: {
      type: 'object',
      required: ['mode', 'context', 'model', 'degraded', 'generatedAt'],
      properties: {
        mode: { type: 'string' },
        context: { type: 'string' },
        model: { type: 'string' },
        degraded: { type: 'boolean' },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

export const errorSchema = {
  $id: 'ApiError',
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {},
      },
    },
  },
};
