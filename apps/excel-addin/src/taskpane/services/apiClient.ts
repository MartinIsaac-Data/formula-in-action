import type { ExplainRequestInput, ExplanationResult } from '@formula-in-action/shared-types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:8787').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

/** POST the formula (and light metadata only) to the explanation API. */
export async function requestExplanation(
  body: ExplainRequestInput,
  signal?: AbortSignal,
): Promise<ExplanationResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/v1/explain`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(
      `Could not reach the explanation service at ${API_BASE_URL}. Is it running?`,
      0,
      'network_error',
    );
  }

  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const envelope = payload as ErrorEnvelope;
    throw new ApiError(
      envelope.error?.message ?? `Request failed (${response.status}).`,
      response.status,
      envelope.error?.code ?? 'unknown_error',
    );
  }

  return payload as ExplanationResult;
}

export { API_BASE_URL };
