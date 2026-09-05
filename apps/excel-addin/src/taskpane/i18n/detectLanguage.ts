/* global Office */
import { DEFAULT_LANGUAGE, TRANSLATIONS, type Language } from './translations';

const SUPPORTED = Object.keys(TRANSLATIONS) as Language[];

/** Map a BCP-47 tag (e.g. "fr-FR", "fr", "en-GB") to a supported UI language, if any. */
export function languageFromTag(tag: string | undefined | null): Language | null {
  if (!tag) return null;
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED as string[]).includes(primary) ? (primary as Language) : null;
}

/**
 * Best-effort initial language: Office's own display language first (it knows
 * the user's actual Office UI language), then the browser/WebView locale,
 * then English.
 */
export function detectLanguage(): Language {
  try {
    const officeTag = typeof Office !== 'undefined' ? Office.context?.displayLanguage : undefined;
    const fromOffice = languageFromTag(officeTag);
    if (fromOffice) return fromOffice;
  } catch {
    /* Office not ready */
  }
  try {
    const fromBrowser = languageFromTag(typeof navigator !== 'undefined' ? navigator.language : undefined);
    if (fromBrowser) return fromBrowser;
  } catch {
    /* navigator unavailable */
  }
  return DEFAULT_LANGUAGE;
}
