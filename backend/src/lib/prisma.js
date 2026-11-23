import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }],
});
prisma.$on('error', (e) => logger.error({ prisma: e }, 'prisma error'));
prisma.$on('warn', (e) => logger.warn({ prisma: e }, 'prisma warn'));

export async function initPragmas() {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
}

export default prisma;