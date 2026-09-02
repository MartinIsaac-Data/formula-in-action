/* global Office */
import { webDarkTheme, webLightTheme, type Theme } from '@fluentui/react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export function hexLuminance(hex?: string): number | null {
  if (!hex) return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function detectMode(): ThemeMode {
  const bg =
    typeof Office !== 'undefined'
      ? Office.context?.officeTheme?.bodyBackgroundColor
      : undefined;
  const lum = hexLuminance(bg);
  if (lum !== null) return lum < 0.5 ? 'dark' : 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Resolves the Fluent theme from Office's theme (falling back to the OS
 * preference), with a manual override the user can toggle in the header.
 */
export function useOfficeTheme(): { theme: Theme; mode: ThemeMode; toggle: () => void } {
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const [detected, setDetected] = useState<ThemeMode>(() => detectMode());

  useEffect(() => {
    const media =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    if (!media) return;
    const onChange = (): void => setDetected(detectMode());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const mode = override ?? detected;
  const toggle = useCallback(() => {
    setOverride((current) => ((current ?? detected) === 'dark' ? 'light' : 'dark'));
  }, [detected]);

  const theme = useMemo(() => (mode === 'dark' ? webDarkTheme : webLightTheme), [mode]);

  return { theme, mode, toggle };
}
