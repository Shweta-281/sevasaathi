import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import prisma, { initPragmas } from './lib/prisma.js';
import { startJobs } from './jobs/index.js';

async function main() {
  await initPragmas();
  startJobs();
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'SevaSaathi API listening');
  });
  const shutdown = (signal) => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
main().catch((e) => { logger.error({ err: e }, 'failed to start'); process.exit(1); });
