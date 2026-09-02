import type { ExplainRequestInput, ExplanationResult } from '@formula-in-action/shared-types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:8787').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 2;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterMs?: number;

  constructor(message: string, status: number, code: string, retryAfterMs?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

const isAbort = (value: unknown): boolean =>
  value instanceof DOMException && value.name === 'AbortError';

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

/**
 * POST the formula (and light metadata only — never cell values) to the
 * explanation API. Times out after 30s and retries once on transient errors.
 */
export async function requestExplanation(
  body: ExplainRequestInput,
  signal?: AbortSignal,
): Promise<ExplanationResult> {
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
    const composite = mergeSignals(signal, timeout.signal);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/explain`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: composite,
      });

      const payload: unknown = await response.json().catch(() => ({}));

      if (response.ok) return payload as ExplanationResult;

      const envelope = payload as ErrorEnvelope;
      lastError = new ApiError(
        envelope.error?.message ?? `Request failed (${response.status}).`,
        response.status,
        envelope.error?.code ?? 'unknown_error',
        parseRetryAfter(response.headers.get('retry-after')),
      );

      if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_ATTEMPTS) throw lastError;
    } catch (cause) {
      if (isAbort(cause)) {
        if (signal?.aborted) throw cause; // caller cancelled — propagate
        throw new ApiError('The explanation service took too long to respond.', 408, 'timeout');
      }
      if (cause instanceof ApiError) {
        if (!RETRYABLE_STATUS.has(cause.status) || attempt === MAX_ATTEMPTS) throw cause;
        lastError = cause;
      } else {
        throw new ApiError(
          `Could not reach the explanation service at ${API_BASE_URL}. Is it running?`,
          0,
          'network_error',
        );
      }
    } finally {
      clearTimeout(timer);
    }

    await delay(400 * attempt);
  }

  throw lastError ?? new ApiError('Request failed.', 0, 'unknown_error');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Abort when either input signal aborts (AbortSignal.any isn't universal yet). */
function mergeSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b;
  const controller = new AbortController();
  const forward = (): void => controller.abort();
  if (a.aborted || b.aborted) controller.abort();
  a.addEventListener('abort', forward, { once: true });
  b.addEventListener('abort', forward, { once: true });
  return controller.signal;
}

export { API_BASE_URL };
