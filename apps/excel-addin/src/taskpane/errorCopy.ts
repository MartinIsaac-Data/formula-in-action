import type { ApiError } from './services/apiClient';

export interface FriendlyError {
  title: string;
  detail: string;
  canRetry: boolean;
}

/** Map an ApiError code to task-pane copy. */
export function explanationErrorCopy(error: ApiError): FriendlyError {
  switch (error.code) {
    case 'unparseable_formula':
      return {
        title: "That formula couldn't be read",
        detail:
          'It may be incomplete, or use syntax this tool does not support yet. Check the cell and try again.',
        canRetry: false,
      };
    case 'formula_too_long':
      return {
        title: 'That formula is very long',
        detail:
          'Formula in Action explains formulas up to about 8,000 characters. Try selecting a smaller cell or explaining a sub-part.',
        canRetry: false,
      };
    case 'invalid_request':
      return { title: 'The request was rejected', detail: error.message, canRetry: false };
    case 'rate_limited':
      return {
        title: 'Too many requests',
        detail: error.retryAfterMs
          ? `Give it ${Math.ceil(error.retryAfterMs / 1000)} seconds, then try again.`
          : 'Give it a few seconds, then try again.',
        canRetry: true,
      };
    case 'timeout':
      return {
        title: 'The service is taking too long',
        detail: 'It may be busy right now. Try again in a moment.',
        canRetry: true,
      };
    case 'network_error':
      return {
        title: "Can't reach the explanation service",
        detail: 'Check that the API is running and reachable from Excel.',
        canRetry: true,
      };
    default:
      return { title: 'Could not generate an explanation', detail: error.message, canRetry: true };
  }
}
