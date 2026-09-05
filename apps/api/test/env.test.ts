import { describe, expect, it } from 'vitest';
import { loadEnv, resolvedAiApiKey, resolvedAiModel } from '../src/env';

const base = { NODE_ENV: 'test' } as unknown as NodeJS.ProcessEnv;

describe('resolvedAiModel', () => {
  it('defaults to claude-sonnet-5 for the default provider', () => {
    expect(resolvedAiModel(loadEnv(base))).toBe('claude-sonnet-5');
  });

  it('defaults to deepseek-chat when AI_PROVIDER=deepseek', () => {
    const env = loadEnv({ ...base, AI_PROVIDER: 'deepseek' } as unknown as NodeJS.ProcessEnv);
    expect(resolvedAiModel(env)).toBe('deepseek-chat');
  });

  it('an explicit AI_MODEL always wins', () => {
    const env = loadEnv({
      ...base,
      AI_PROVIDER: 'deepseek',
      AI_MODEL: 'deepseek-reasoner',
    } as unknown as NodeJS.ProcessEnv);
    expect(resolvedAiModel(env)).toBe('deepseek-reasoner');
  });
});

describe('resolvedAiApiKey', () => {
  it('reads ANTHROPIC_API_KEY for the claude provider', () => {
    const env = loadEnv({
      ...base,
      ANTHROPIC_API_KEY: 'ant-key',
      DEEPSEEK_API_KEY: 'ds-key',
    } as unknown as NodeJS.ProcessEnv);
    expect(resolvedAiApiKey(env)).toBe('ant-key');
  });

  it('reads DEEPSEEK_API_KEY when AI_PROVIDER=deepseek', () => {
    const env = loadEnv({
      ...base,
      AI_PROVIDER: 'deepseek',
      ANTHROPIC_API_KEY: 'ant-key',
      DEEPSEEK_API_KEY: 'ds-key',
    } as unknown as NodeJS.ProcessEnv);
    expect(resolvedAiApiKey(env)).toBe('ds-key');
  });
});

describe('loadEnv production validation', () => {
  it('throws in production cloud mode without the matching key', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' } as unknown as NodeJS.ProcessEnv)).toThrow(
      /ANTHROPIC_API_KEY/,
    );
    expect(() =>
      loadEnv({ NODE_ENV: 'production', AI_PROVIDER: 'deepseek' } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/DEEPSEEK_API_KEY/);
  });

  it('does not throw once the matching key is present', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', ANTHROPIC_API_KEY: 'k' } as unknown as NodeJS.ProcessEnv),
    ).not.toThrow();
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        AI_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'k',
      } as unknown as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('never throws outside production', () => {
    expect(() => loadEnv(base)).not.toThrow();
  });
});
