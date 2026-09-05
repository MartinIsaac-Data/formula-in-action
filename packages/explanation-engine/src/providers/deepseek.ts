import OpenAI from 'openai';
import type { AiCompletionRequest, AiProvider } from '../provider';
import { ProviderRefusedError, ProviderUnavailableError } from '../provider';

/**
 * DeepSeek provider. DeepSeek's API is OpenAI-compatible, so this uses the
 * `openai` SDK with `baseURL` overridden — DeepSeek's own documented
 * integration path, rather than a hand-rolled HTTP client.
 *
 * DeepSeek's JSON mode (`response_format: { type: 'json_object' }`) is a
 * simpler, more reliable contract than Claude's structured-output config, but
 * — like OpenAI's — requires the word "json" to appear somewhere in the
 * messages. `buildPrompt`'s system prompt already says "Reply with ONE JSON
 * object...", so this is satisfied without special-casing the prompt per
 * provider.
 */
export class DeepSeekProvider implements AiProvider {
  readonly id: string;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: { apiKey?: string; model: string }) {
    if (!options.apiKey) {
      throw new ProviderUnavailableError('DEEPSEEK_API_KEY is not configured');
    }
    this.client = new OpenAI({ apiKey: options.apiKey, baseURL: 'https://api.deepseek.com' });
    this.model = options.model;
    this.id = options.model;
  }

  async complete(request: AiCompletionRequest): Promise<string> {
    let response: OpenAI.Chat.Completions.ChatCompletion;
    try {
      response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: request.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      });
    } catch (error) {
      throw normalizeError(error);
    }

    const choice = response.choices[0];
    if (choice?.finish_reason === 'content_filter') {
      throw new ProviderRefusedError('The model declined to explain this formula');
    }

    const text = choice?.message?.content?.trim();
    if (!text) {
      throw new ProviderUnavailableError('The model returned an empty response');
    }
    return text;
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof OpenAI.APIError) {
    return new ProviderUnavailableError(`DeepSeek API error (${error.status ?? 'unknown'}): ${error.message}`);
  }
  return new ProviderUnavailableError(error instanceof Error ? error.message : 'Unknown provider error');
}
