import { explainFormula, FormulaParseError } from '@formula-in-action/explanation-engine';
import { ExplainRequestSchema, MAX_FORMULA_LENGTH } from '@formula-in-action/shared-types';
import type { FastifyPluginAsync } from 'fastify';
import { sanitizeFormula } from '../lib/sanitize';

export const explainRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/v1/explain',
    {
      schema: {
        tags: ['explain'],
        summary: 'Explain an Excel formula',
        description:
          'Sends only the formula and light metadata (never cell values or the workbook). ' +
          'Deterministic fields come from the analysis engine; prose from the AI provider, ' +
          'with a template fallback when the provider is unavailable.',
        body: { $ref: 'ExplainRequest#' },
        response: {
          200: { $ref: 'ExplanationResult#' },
          400: { $ref: 'ApiError#' },
          422: { $ref: 'ApiError#' },
          429: { $ref: 'ApiError#' },
          500: { $ref: 'ApiError#' },
        },
      },
    },
    async (request, reply) => {
      const rawFormula = (request.body as { formula?: unknown })?.formula;
      if (typeof rawFormula === 'string' && rawFormula.length > MAX_FORMULA_LENGTH) {
        return reply.code(400).send({
          error: {
            code: 'formula_too_long',
            message: `Formulas up to ${MAX_FORMULA_LENGTH} characters are supported.`,
          },
        });
      }

      const parsed = ExplainRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'invalid_request',
            message: 'Request body failed validation.',
            details: parsed.error.issues,
          },
        });
      }

      const input = { ...parsed.data, formula: sanitizeFormula(parsed.data.formula) };
      if (input.formula.length === 0) {
        return reply.code(400).send({
          error: { code: 'invalid_request', message: 'Formula is empty after sanitisation.' },
        });
      }

      try {
        const result = await explainFormula(input, {
          provider: app.aiProvider,
          maxTokens: app.appConfig.maxTokens,
        });
        return reply.send(result);
      } catch (err) {
        if (err instanceof FormulaParseError) {
          return reply.code(422).send({
            error: {
              code: 'unparseable_formula',
              message: `This does not look like a valid Excel formula: ${err.message}`,
            },
          });
        }
        request.log.error({ err }, 'explain failed');
        return reply.code(500).send({
          error: { code: 'internal_error', message: 'Could not generate an explanation.' },
        });
      }
    },
  );
};
