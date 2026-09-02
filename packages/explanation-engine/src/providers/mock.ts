import type { AiCompletionRequest, AiProvider } from '../provider';

/** Test double. Returns a fixed string or the result of a function. */
export class MockProvider implements AiProvider {
  readonly id: string;
  private readonly responder: (request: AiCompletionRequest) => string | Promise<string>;

  constructor(
    responder: string | ((request: AiCompletionRequest) => string | Promise<string>),
    id = 'mock',
  ) {
    this.id = id;
    this.responder = typeof responder === 'string' ? () => responder : responder;
  }

  async complete(request: AiCompletionRequest): Promise<string> {
    return this.responder(request);
  }
}

/** A MockProvider whose `complete` always rejects, to exercise the fallback path. */
export class FailingProvider implements AiProvider {
  readonly id = 'failing';
  constructor(private readonly error: Error = new Error('provider failure')) {}
  async complete(): Promise<string> {
    return Promise.reject(this.error);
  }
}
