/* global Office */
import type { ExplanationContext, ExplanationMode } from '@formula-in-action/shared-types';
import { useCallback, useState } from 'react';
import { DEFAULT_CONTEXT, DEFAULT_MODE, PREFS_KEY } from '../constants';
import { DEFAULT_EXPLANATION_LANGUAGE, detectLanguage, type ExplanationLanguage, type Language } from '../i18n';

export interface Preferences {
  mode: ExplanationMode;
  context: ExplanationContext;
  /** UI chrome language — auto-detected, no manual control exposed. */
  language: Language;
  /** Language the AI writes the explanation in. 'auto' follows `language`. */
  explanationLanguage: ExplanationLanguage;
}

function defaults(): Preferences {
  return {
    mode: DEFAULT_MODE,
    context: DEFAULT_CONTEXT,
    language: detectLanguage(),
    explanationLanguage: DEFAULT_EXPLANATION_LANGUAGE,
  };
}

function readPreferences(): Preferences {
  const fallback = defaults();
  try {
    const roaming = Office?.context?.roamingSettings?.get(PREFS_KEY) as Partial<Preferences> | undefined;
    if (roaming?.mode && roaming.context) return { ...fallback, ...roaming };
  } catch {
    /* roamingSettings not ready */
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) return { ...fallback, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

function writePreferences(prefs: Preferences): void {
  try {
    const roaming = Office?.context?.roamingSettings;
    if (roaming) {
      roaming.set(PREFS_KEY, prefs);
      roaming.saveAsync();
    }
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Per-user mode/context/language prefs, persisted via Office roaming settings (localStorage fallback). */
export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [prefs, setPrefs] = useState<Preferences>(() => readPreferences());

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writePreferences(next);
      return next;
    });
  }, []);

  return [prefs, update];
}
