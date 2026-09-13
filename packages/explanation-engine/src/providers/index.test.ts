import { describe, expect, it } from 'vitest';
import { ProviderUnavailableError } from '../provider';
import { ClaudeProvider } from './claude';
import { DeepSeekProvider } from './deepseek';
import { createProvider } from './index';
import { StubEnterpriseProvider, StubLocalProvider } from './stub';

describe('createProvider', () => {
  it('defaults privacyMode "cloud" to Claude', () => {
    const provider = createProvider({ privacyMode: 'cloud', model: 'claude-sonnet-5', apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(ClaudeProvider);
    expect(provider.id).toBe('claude-sonnet-5');
  });

  it('builds a DeepSeekProvider when cloudProvider is "deepseek"', () => {
    const provider = createProvider({
      privacyMode: 'cloud',
      cloudProvider: 'deepseek',
      model: 'deepseek-flash',
      apiKey: 'test-key',
    });
    expect(provider).toBeInstanceOf(DeepSeekProvider);
    expect(provider.id).toBe('deepseek-flash');
  });

  it('still resolves the local and enterprise stubs', () => {
    expect(createProvider({ privacyMode: 'local', model: 'n/a' })).toBeInstanceOf(StubLocalProvider);
    expect(createProvider({ privacyMode: 'enterprise', model: 'n/a' })).toBeInstanceOf(StubEnterpriseProvider);
  });
});

describe('DeepSeekProvider', () => {
  it('refuses to construct without an API key', () => {
    expect(() => new DeepSeekProvider({ model: 'deepseek-flash' })).toThrow(ProviderUnavailableError);
  });
});
