import { buildApp } from './app';
import { loadEnv } from './env';

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp({ env });

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
