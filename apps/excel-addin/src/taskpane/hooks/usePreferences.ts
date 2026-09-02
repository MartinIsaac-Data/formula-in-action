/* global Office */
import type { ExplanationContext, ExplanationMode } from '@formula-in-action/shared-types';
import { useCallback, useState } from 'react';
import { DEFAULT_CONTEXT, DEFAULT_MODE, PREFS_KEY } from '../constants';

export interface Preferences {
  mode: ExplanationMode;
  context: ExplanationContext;
}

const DEFAULTS: Preferences = { mode: DEFAULT_MODE, context: DEFAULT_CONTEXT };

function readPreferences(): Preferences {
  try {
    const roaming = Office?.context?.roamingSettings?.get(PREFS_KEY) as Preferences | undefined;
    if (roaming?.mode && roaming.context) return { ...DEFAULTS, ...roaming };
  } catch {
    /* roamingSettings not ready */
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    /* storage unavailable */
  }
  return DEFAULTS;
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

/** Per-user mode/context, persisted via Office roaming settings (localStorage fallback). */
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
