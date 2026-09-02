import type { ExplanationContext, ExplanationMode } from '@formula-in-action/shared-types';

export const MODE_OPTIONS: { value: ExplanationMode; label: string; hint: string }[] = [
  { value: 'simple', label: 'Simple', hint: 'Plain language for a beginner' },
  { value: 'technical', label: 'Technical', hint: 'Functions, arguments, evaluation order' },
  { value: 'formula-in-action', label: 'In Action', hint: 'A real-world scenario' },
];

export const CONTEXT_OPTIONS: { value: ExplanationContext; label: string }[] = [
  { value: 'everyday', label: 'Everyday life' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Finance' },
  { value: 'sales', label: 'Sales' },
  { value: 'supply-chain', label: 'Supply chain' },
  { value: 'hr', label: 'Human resources' },
  { value: 'education', label: 'Education' },
];

export const DEFAULT_MODE: ExplanationMode = 'simple';
export const DEFAULT_CONTEXT: ExplanationContext = 'business';

export const PREFS_KEY = 'formula-in-action:prefs';
