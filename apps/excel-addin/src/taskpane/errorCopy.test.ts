import { describe, expect, it } from 'vitest';
import { ApiError } from './services/apiClient';
import { explanationErrorCopy } from './errorCopy';

describe('explanationErrorCopy', () => {
  it('marks client mistakes as non-retryable', () => {
    expect(explanationErrorCopy(new ApiError('x', 422, 'unparseable_formula')).canRetry).toBe(false);
    expect(explanationErrorCopy(new ApiError('x', 400, 'formula_too_long')).canRetry).toBe(false);
  });

  it('marks transient failures as retryable', () => {
    for (const code of ['rate_limited', 'timeout', 'network_error', 'internal_error']) {
      expect(explanationErrorCopy(new ApiError('x', 500, code)).canRetry).toBe(true);
    }
  });

  it('includes the retry-after hint when present', () => {
    const copy = explanationErrorCopy(new ApiError('x', 429, 'rate_limited', 3000));
    expect(copy.detail).toMatch(/3 seconds/);
  });

  it('falls back to the server message for unknown codes', () => {
    const copy = explanationErrorCopy(new ApiError('boom', 500, 'weird_code'));
    expect(copy.detail).toBe('boom');
    expect(copy.canRetry).toBe(true);
  });
});
