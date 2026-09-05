import type { Dictionary } from './i18n';
import type { ApiError } from './services/apiClient';

export interface FriendlyError {
  title: string;
  detail: string;
  canRetry: boolean;
}

/** Map an ApiError code to task-pane copy, in the current language. */
export function explanationErrorCopy(error: ApiError, t: Dictionary): FriendlyError {
  switch (error.code) {
    case 'unparseable_formula':
      return { title: t.error.unparseableTitle, detail: t.error.unparseableDetail, canRetry: false };
    case 'formula_too_long':
      return { title: t.error.tooLongTitle, detail: t.error.tooLongDetail, canRetry: false };
    case 'invalid_request':
      return { title: t.error.invalidRequestTitle, detail: error.message, canRetry: false };
    case 'rate_limited':
      return {
        title: t.error.rateLimitedTitle,
        detail: error.retryAfterMs
          ? t.error.rateLimitedDetail(Math.ceil(error.retryAfterMs / 1000))
          : t.error.rateLimitedDetailGeneric,
        canRetry: true,
      };
    case 'timeout':
      return { title: t.error.timeoutTitle, detail: t.error.timeoutDetail, canRetry: true };
    case 'network_error':
      return { title: t.error.networkTitle, detail: t.error.networkDetail, canRetry: true };
    default:
      return { title: t.error.genericTitle, detail: error.message, canRetry: true };
  }
}
