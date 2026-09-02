import type { PrivacyMode } from '@formula-in-action/shared-types';

export interface AiCompletionRequest {
  system: string;
  user: string;
  /** JSON Schema the model output must satisfy (used for structured-output mode). */
  jsonSchema: Record<string, unknown>;
  maxTokens: number;
}

/**
 * Minimal seam between the engine and any LLM. Implementations return the raw
 * assistant text (expected to be a single JSON object); the engine validates it.
 */
export interface AiProvider {
  /** Stable identifier recorded in `ExplanationResult.meta.model`. */
  readonly id: string;
  complete(request: AiCompletionRequest): Promise<string>;
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRefusedError';
  }
}

export interface ProviderConfig {
  privacyMode: PrivacyMode;
  model: string;
  apiKey?: string;
  /** Ask the provider to enforce the JSON schema server-side when it can. */
  structuredOutput?: boolean;
  /** Local model endpoint / enterprise endpoint (stubs for now). */
  endpoint?: string;
}
