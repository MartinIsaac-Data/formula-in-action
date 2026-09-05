import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE, TRANSLATIONS, type Dictionary, type Language } from './translations';

const I18nContext = createContext<Dictionary>(TRANSLATIONS[DEFAULT_LANGUAGE]);

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}): JSX.Element {
  return <I18nContext.Provider value={TRANSLATIONS[language]}>{children}</I18nContext.Provider>;
}

/** The current language's dictionary. Falls back to English outside a provider (e.g. isolated tests). */
export function useTranslation(): Dictionary {
  return useContext(I18nContext);
}
