import { useCallback, useState } from 'react';
import { isTelemetryEnabled, setTelemetryEnabled } from '../services/telemetry';

/** Opt-in usage telemetry consent, defaulting to off until the user enables it. */
export function useTelemetryConsent(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => isTelemetryEnabled());

  const update = useCallback((next: boolean) => {
    setTelemetryEnabled(next);
    setEnabled(next);
  }, []);

  return [enabled, update];
}
