// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTelemetryEnabled, setTelemetryEnabled, track } from './telemetry';

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('telemetry opt-in', () => {
  it('defaults to disabled', () => {
    expect(isTelemetryEnabled()).toBe(false);
  });

  it('persists the opt-in choice to localStorage', () => {
    setTelemetryEnabled(true);
    expect(isTelemetryEnabled()).toBe(true);
    setTelemetryEnabled(false);
    expect(isTelemetryEnabled()).toBe(false);
  });
});

describe('track', () => {
  it('does not call fetch when telemetry is disabled', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setTelemetryEnabled(false);

    track('pane_opened');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs a well-formed, formula-free event when enabled', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    setTelemetryEnabled(true);

    track('mode_changed', { mode: 'technical' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/v1\/events$/);
    const body = JSON.parse(init.body as string) as { event: string; props: Record<string, unknown> };
    expect(body.event).toBe('mode_changed');
    expect(body.props).toEqual({ mode: 'technical' });
    expect(JSON.stringify(body)).not.toMatch(/=[A-Za-z]/); // no formula-shaped string ever
  });

  it('never throws even if fetch rejects', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    setTelemetryEnabled(true);
    expect(() => track('regenerated')).not.toThrow();
  });
});
