// Must run before any other import touches process.env. Silently a no-op if
// .env doesn't exist (e.g. production, where the platform injects env vars).
import 'dotenv/config';

import { buildApp } from './app';
import { getDevHttpsOptions } from './devCerts';
import { loadEnv } from './env';

async function main(): Promise<void> {
  const env = loadEnv();
  // HTTPS locally so the (HTTPS) task pane can call this without a mixed-content
  // block; in production the platform (Container Apps / Render) terminates TLS.
  const https = env.NODE_ENV === 'development' ? await getDevHttpsOptions() : undefined;
  if (env.NODE_ENV === 'development' && !https) {
    console.warn(
      '[dev] Office dev certs not found — serving plain HTTP. ' +
        'Run: pnpm --filter @formula-in-action/excel-addin certs',
    );
  }
  const app = await buildApp({ env, https });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    app.log.error({ err }, 'failed to start');
    process.exit(1);
  }
}

void main();
