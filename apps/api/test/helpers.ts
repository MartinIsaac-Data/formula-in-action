import { MockProvider, type AiProvider } from '@formula-in-action/explanation-engine';
import { buildApp } from '../src/app';
import { loadEnv } from '../src/env';

export const VALID_DRAFT = JSON.stringify({
  summary: 'Divides A2 by B2 and returns 0 on error.',
  simpleExplanation: 'It divides one value by another and shows 0 if that fails.',
  technicalExplanation: 'IFERROR wraps the division A2/B2 and returns 0 on any error value.',
  steps: [{ step: 1, formulaPart: 'A2/B2', explanation: 'Divide A2 by B2.' }],
  illustrativeExample: {
    title: 'Formula in Action',
    scenario: '100 items across 10 stores.',
    calculation: '100 / 10 = 10',
    result: '10 per store.',
  },
  suggestions: [],
});

export function testApp(provider: AiProvider = new MockProvider(VALID_DRAFT, 'mock-model')) {
  const env = loadEnv({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
  return buildApp({ env, provider });
}
