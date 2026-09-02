import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const pkg = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@formula-in-action/shared-types': pkg('shared-types'),
      '@formula-in-action/formula-parser': pkg('formula-parser'),
      '@formula-in-action/formula-analyzer': pkg('formula-analyzer'),
      '@formula-in-action/risk-detector': pkg('risk-detector'),
      '@formula-in-action/kpi-detector': pkg('kpi-detector'),
      '@formula-in-action/explanation-engine': pkg('explanation-engine'),
    },
  },
  test: {
    include: [
      'packages/**/*.test.{ts,tsx}',
      'apps/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/types.ts', '**/*.d.ts'],
    },
  },
});
