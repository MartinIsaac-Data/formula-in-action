import { LANGUAGE_LOCALE, type Language } from './translations';

/**
 * The language the AI writes the *explanation content* in — independent of
 * the app's own UI language (see translations.ts). A user working in an
 * English UI can still ask for explanations in French, and vice versa.
 */
export type ExplanationLanguage =
  | 'auto'
  | 'en-US'
  | 'fr-FR'
  | 'es-ES'
  | 'de-DE'
  | 'it-IT'
  | 'pt-PT'
  | 'nl-NL'
  | 'ja-JP'
  | 'zh-CN'
  | 'ko-KR'
  | 'ar-SA'
  | 'ru-RU'
  | 'pl-PL'
  | 'tr-TR';

export const DEFAULT_EXPLANATION_LANGUAGE: ExplanationLanguage = 'auto';

/**
 * Display name for each option. Real language names are shown in their own
 * script (the standard, universally-understood convention for language
 * pickers) — only "Automatic" is UI chrome and gets translated at the call site.
 */
export const EXPLANATION_LANGUAGE_NAMES: Record<Exclude<ExplanationLanguage, 'auto'>, string> = {
  'en-US': 'English',
  'fr-FR': 'Français',
  'es-ES': 'Español',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'pt-PT': 'Português',
  'nl-NL': 'Nederlands',
  'ja-JP': '日本語',
  'zh-CN': '中文',
  'ko-KR': '한국어',
  'ar-SA': 'العربية',
  'ru-RU': 'Русский',
  'pl-PL': 'Polski',
  'tr-TR': 'Türkçe',
};

/** 'auto' follows the detected UI language; anything else is used as-is. */
export function resolveExplanationLocale(
  explanationLanguage: ExplanationLanguage,
  uiLanguage: Language,
): string {
  return explanationLanguage === 'auto' ? LANGUAGE_LOCALE[uiLanguage] : explanationLanguage;
}

export const EXPLANATION_LANGUAGE_VALUES: ExplanationLanguage[] = [
  'auto',
  'en-US',
  'fr-FR',
  'es-ES',
  'de-DE',
  'it-IT',
  'pt-PT',
  'nl-NL',
  'ja-JP',
  'zh-CN',
  'ko-KR',
  'ar-SA',
  'ru-RU',
  'pl-PL',
  'tr-TR',
];
