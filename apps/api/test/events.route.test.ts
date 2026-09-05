import { MockProvider } from '@formula-in-action/explanation-engine';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { loadEnv } from '../src/env';
import { testApp } from './helpers';

const validEvent = {
  event: 'explanation_shown',
  sessionId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  ts: '2026-09-05T12:00:00.000Z',
  props: { mode: 'simple', context: 'business', degraded: false, warningCount: 1 },
};

describe('POST /v1/events', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app?.close();
  });

  it('accepts a well-formed event and never echoes it back', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'POST', url: '/v1/events', payload: validEvent });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });
  });

  it('rejects a props key outside the whitelist (anti formula-smuggling)', async () => {
    app = await testApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: { ...validEvent, props: { ...validEvent.props, formula: '=A1' } },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an unknown event name', async () => {
    app = await testApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: { ...validEvent, event: 'user_typed_a_formula' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a malformed sessionId', async () => {
    app = await testApp();
    const res = await app.inject({ method: 'POST', url: '/v1/events', payload: { ...validEvent, sessionId: 'not-a-uuid' } });
    expect(res.statusCode).toBe(400);
  });

  it('still responds 202 to a well-formed event when telemetry is disabled server-side', async () => {
    const env = loadEnv({ NODE_ENV: 'test', TELEMETRY_ENABLED: 'false' } as unknown as NodeJS.ProcessEnv);
    app = await buildApp({ env, provider: new MockProvider('{}', 'mock') });
    // The client never has to know or care that collection is off.
    const res = await app.inject({ method: 'POST', url: '/v1/events', payload: validEvent });
    expect(res.statusCode).toBe(202);
  });

  it('still validates the request shape when telemetry is disabled', async () => {
    const env = loadEnv({ NODE_ENV: 'test', TELEMETRY_ENABLED: 'false' } as unknown as NodeJS.ProcessEnv);
    app = await buildApp({ env, provider: new MockProvider('{}', 'mock') });
    const res = await app.inject({ method: 'POST', url: '/v1/events', payload: { nonsense: true } });
    expect(res.statusCode).toBe(400);
  });
});
