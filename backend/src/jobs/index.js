import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { cleanupExpiredAadhaar, cleanupExpiredDocuments } from './retention.js';

export function startJobs() {
  cron.schedule('0 2 * * *', async () => {
    try { await Promise.all([cleanupExpiredAadhaar(), cleanupExpiredDocuments()]); }
    catch (e) { logger.error({ err: e }, 'retention job failed'); }
  });
  cron.schedule('0 * * * *', async () => {
    try {
      const n = await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      logger.debug({ deleted: n.count }, 'expired refresh cleanup');
    } catch (e) { logger.error({ err: e }, 'refresh cleanup failed'); }
  });
}
