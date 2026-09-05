/* global Office */
import type { TelemetryEventInput, TelemetryEventName, TelemetryProps } from '@formula-in-action/shared-types';
import { API_BASE_URL } from './apiClient';

const TELEMETRY_OPT_IN_KEY = 'formula-in-action:telemetry-opt-in';

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older WebView2 hosts without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** One id per pane load — not persisted, not tied to a user identity. */
const sessionId = randomUuid();

function readOptIn(): boolean {
  try {
    const roaming = Office?.context?.roamingSettings?.get(TELEMETRY_OPT_IN_KEY) as boolean | undefined;
    if (typeof roaming === 'boolean') return roaming;
  } catch {
    /* roamingSettings not ready */
  }
  try {
    return window.localStorage.getItem(TELEMETRY_OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isTelemetryEnabled(): boolean {
  return readOptIn();
}

export function setTelemetryEnabled(enabled: boolean): void {
  try {
    const roaming = Office?.context?.roamingSettings;
    if (roaming) {
      roaming.set(TELEMETRY_OPT_IN_KEY, enabled);
      roaming.saveAsync();
    }
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(TELEMETRY_OPT_IN_KEY, String(enabled));
  } catch {
    /* ignore */
  }
}

/**
 * Send one anonymous usage event, if (and only if) the user opted in. Never
 * throws, never blocks the UI, never includes formula content — `props` is the
 * same whitelisted shape the API enforces server-side.
 */
export function track(event: TelemetryEventName, props: TelemetryProps = {}): void {
  if (!isTelemetryEnabled()) return;

  const body: TelemetryEventInput = { event, sessionId, ts: new Date().toISOString(), props };

  try {
    void fetch(`${API_BASE_URL}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* telemetry must never break the pane */
  }
}
