import Anthropic from '@anthropic-ai/sdk';
import type { AiCompletionRequest, AiProvider } from '../provider';
import { ProviderRefusedError, ProviderUnavailableError } from '../provider';

interface BaseParams {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: 'user'; content: string }[];
}

/**
 * Anthropic Claude provider. Tries server-side structured output first and
 * transparently retries once without it if the API rejects that request shape,
 * so the engine still gets JSON it can validate.
 *
 * A missing API key is not fatal at construction — it surfaces on `complete()`
 * so the engine can fall back to the deterministic template.
 */
export class ClaudeProvider implements AiProvider {
  readonly id: string;
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly structuredOutput: boolean;
  private client?: Anthropic;

  constructor(options: { apiKey?: string; model: string; structuredOutput?: boolean }) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.id = options.model;
    this.structuredOutput = options.structuredOutput ?? true;
  }

  async complete(request: AiCompletionRequest): Promise<string> {
    const client = this.getClient();
    const base: BaseParams = {
      model: this.model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    };

    try {
      return await this.send(client, base, request.jsonSchema, this.structuredOutput);
    } catch (error) {
      if (this.structuredOutput && error instanceof Anthropic.BadRequestError) {
        return this.send(client, base, request.jsonSchema, false);
      }
      throw normalizeError(error);
    }
  }

  private getClient(): Anthropic {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('ANTHROPIC_API_KEY is not configured');
    }
    this.client ??= new Anthropic({ apiKey: this.apiKey });
    return this.client;
  }

  private async send(
    client: Anthropic,
    base: BaseParams,
    jsonSchema: Record<string, unknown>,
    withSchema: boolean,
  ): Promise<string> {
    const outputConfig: Record<string, unknown> = { effort: 'low' };
    if (withSchema) {
      outputConfig['format'] = { type: 'json_schema', name: 'formula_explanation', schema: jsonSchema };
    }

    const response = await client.messages.create({
      ...base,
      output_config: outputConfig,
    } as unknown as Anthropic.MessageCreateParamsNonStreaming);

    if (response.stop_reason === 'refusal') {
      throw new ProviderRefusedError('The model declined to explain this formula');
    }

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') text += block.text;
    }
    text = text.trim();
    if (!text) {
      throw new ProviderUnavailableError('The model returned an empty response');
    }
    return text;
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof ProviderRefusedError || error instanceof ProviderUnavailableError) {
    return error;
  }
  if (error instanceof Anthropic.APIError) {
    const status = 'status' in error ? String(error.status) : 'unknown';
    return new ProviderUnavailableError(`Anthropic API error (${status}): ${error.message}`);
  }
  return new ProviderUnavailableError(error instanceof Error ? error.message : 'Unknown provider error');
}
