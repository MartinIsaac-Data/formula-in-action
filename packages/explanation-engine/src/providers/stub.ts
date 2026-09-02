import type { AiProvider } from '../provider';
import { ProviderUnavailableError } from '../provider';

/** Placeholder for on-device inference (privacy mode `local`). Wired, not implemented. */
export class StubLocalProvider implements AiProvider {
  readonly id = 'local-stub';
  async complete(): Promise<string> {
    throw new ProviderUnavailableError(
      'Local (on-device) AI is not available in this build. The deterministic template explanation will be used.',
    );
  }
}

/** Placeholder for a customer-hosted endpoint (privacy mode `enterprise`). */
export class StubEnterpriseProvider implements AiProvider {
  readonly id = 'enterprise-stub';
  constructor(private readonly endpoint?: string) {}
  async complete(): Promise<string> {
    throw new ProviderUnavailableError(
      `Enterprise AI endpoint ${this.endpoint ? `(${this.endpoint}) ` : ''}is not wired up yet.`,
    );
  }
}
