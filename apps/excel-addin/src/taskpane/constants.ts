import type { ExplanationContext, ExplanationMode } from '@formula-in-action/shared-types';

/** Display order — labels/hints live in i18n/translations.ts, keyed by these values. */
export const MODE_VALUES: ExplanationMode[] = ['simple', 'technical', 'formula-in-action'];

export const CONTEXT_VALUES: ExplanationContext[] = [
  'everyday',
  'business',
  'finance',
  'sales',
  'supply-chain',
  'hr',
  'education',
];

export const DEFAULT_MODE: ExplanationMode = 'simple';
export const DEFAULT_CONTEXT: ExplanationContext = 'business';

export const PREFS_KEY = 'formula-in-action:prefs';
