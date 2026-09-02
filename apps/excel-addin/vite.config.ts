import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import type { ServerOptions } from 'vite';
import { defineConfig } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));
const DEV_PORT = 3000;

async function httpsOptions(): Promise<ServerOptions['https']> {
  try {
    // office-addin-dev-certs is CJS; tolerate either export shape.
    const mod = (await import('office-addin-dev-certs')) as unknown as Record<string, unknown> & {
      default?: Record<string, unknown>;
    };
    const getOptions = (mod['getHttpsServerOptions'] ?? mod.default?.['getHttpsServerOptions']) as
      | (() => Promise<{ key: Buffer; cert: Buffer; ca: Buffer }>)
      | undefined;
    if (!getOptions) throw new Error('getHttpsServerOptions not found');
    const options = await getOptions();
    return { key: options.key, cert: options.cert, ca: options.ca };
  } catch {
    console.warn(
      '\n[excel-addin] Office dev certificates not found.\n' +
        '  Run  pnpm --filter @formula-in-action/excel-addin certs  once, then restart.\n',
    );
    return undefined;
  }
}

export default defineConfig(async () => ({
  root: here,
  plugins: [react()],
  server: {
    port: DEV_PORT,
    strictPort: true,
    https: await httpsOptions(),
    // Office loads the task pane in an iframe from a different origin.
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: { port: DEV_PORT, strictPort: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        taskpane: fileURLToPath(new URL('./index.html', import.meta.url)),
        commands: fileURLToPath(new URL('./commands.html', import.meta.url)),
      },
    },
  },
}));
