import type { AiProvider, ProviderConfig } from '../provider';
import { ClaudeProvider } from './claude';
import { DeepSeekProvider } from './deepseek';
import { StubEnterpriseProvider, StubLocalProvider } from './stub';

export { ClaudeProvider } from './claude';
export { DeepSeekProvider } from './deepseek';
export { StubLocalProvider, StubEnterpriseProvider } from './stub';
export { MockProvider, FailingProvider } from './mock';

/** Build the provider for a privacy mode. MVP implements `cloud` (Claude or DeepSeek). */
export function createProvider(config: ProviderConfig): AiProvider {
  switch (config.privacyMode) {
    case 'cloud':
      switch (config.cloudProvider ?? 'claude') {
        case 'deepseek':
          return new DeepSeekProvider({ apiKey: config.apiKey, model: config.model });
        default:
          return new ClaudeProvider({
            apiKey: config.apiKey,
            model: config.model,
            structuredOutput: config.structuredOutput,
          });
      }
    case 'local':
      return new StubLocalProvider();
    case 'enterprise':
      return new StubEnterpriseProvider(config.endpoint);
    default: {
      const exhaustive: never = config.privacyMode;
      throw new Error(`Unsupported privacy mode: ${String(exhaustive)}`);
    }
  }
}
