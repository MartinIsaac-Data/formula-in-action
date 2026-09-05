export {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCALE,
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
  type Dictionary,
  type Language,
} from './translations';
export { I18nProvider, useTranslation } from './context';
export { detectLanguage, languageFromTag } from './detectLanguage';
export {
  DEFAULT_EXPLANATION_LANGUAGE,
  EXPLANATION_LANGUAGE_NAMES,
  EXPLANATION_LANGUAGE_VALUES,
  resolveExplanationLocale,
  type ExplanationLanguage,
} from './explanationLanguage';
