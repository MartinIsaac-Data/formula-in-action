import { describe, expect, it } from 'vitest';
import { explanationErrorCopy } from './errorCopy';
import { TRANSLATIONS } from './i18n';
import { ApiError } from './services/apiClient';

const en = TRANSLATIONS.en;
const fr = TRANSLATIONS.fr;

describe('explanationErrorCopy', () => {
  it('marks client mistakes as non-retryable', () => {
    expect(explanationErrorCopy(new ApiError('x', 422, 'unparseable_formula'), en).canRetry).toBe(false);
    expect(explanationErrorCopy(new ApiError('x', 400, 'formula_too_long'), en).canRetry).toBe(false);
  });

  it('marks transient failures as retryable', () => {
    for (const code of ['rate_limited', 'timeout', 'network_error', 'internal_error']) {
      expect(explanationErrorCopy(new ApiError('x', 500, code), en).canRetry).toBe(true);
    }
  });

  it('includes the retry-after hint when present', () => {
    const copy = explanationErrorCopy(new ApiError('x', 429, 'rate_limited', 3000), en);
    expect(copy.detail).toMatch(/3 seconds/);
  });

  it('falls back to the server message for unknown codes', () => {
    const copy = explanationErrorCopy(new ApiError('boom', 500, 'weird_code'), en);
    expect(copy.detail).toBe('boom');
    expect(copy.canRetry).toBe(true);
  });

  it('renders in French when given the French dictionary', () => {
    const copy = explanationErrorCopy(new ApiError('x', 429, 'rate_limited', 5000), fr);
    expect(copy.title).toBe('Trop de requêtes');
    expect(copy.detail).toMatch(/5 secondes/);
  });
});
