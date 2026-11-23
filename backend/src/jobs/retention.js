import prisma from '../lib/prisma.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function cleanupExpiredAadhaar() {
  const cutoff = new Date(Date.now() - config.RETENTION_DAYS * 86400_000);
  const old = await prisma.request.findMany({
    where: {
      aadhaarEncrypted: { not: null },
      createdAt: { lt: cutoff },
      status: { in: ['COMPLETED', 'REJECTED'] },
    },
    select: { id: true },
  });
  if (!old.length) return 0;
  await prisma.request.updateMany({
    where: { id: { in: old.map((r) => r.id) } },
    data: { aadhaarEncrypted: null },
  });
  logger.info({ purged: old.length }, 'aadhaar retention purge');
  return old.length;
}

export async function cleanupExpiredDocuments() {
  const cutoff = new Date(Date.now() - config.RETENTION_DAYS * 86400_000);
  const uploadDir = path.resolve(config.UPLOAD_DIR);
  const documents = await prisma.document.findMany({
    where: { request: { is: { createdAt: { lt: cutoff }, status: { in: ['COMPLETED', 'REJECTED'] } } } },
    select: { id: true, storedName: true },
  });
  let purged = 0;

  for (const document of documents) {
    const filePath = path.resolve(uploadDir, document.storedName);
    if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
      logger.warn({ documentId: document.id }, 'skipped unsafe document retention path');
      continue;
    }
    try {
      await fs.unlink(filePath).catch((error) => { if (error.code !== 'ENOENT') throw error; });
      await prisma.document.delete({ where: { id: document.id } });
      purged += 1;
    } catch (error) {
      logger.error({ err: error, documentId: document.id }, 'document retention delete failed');
    }
  }
  if (purged) logger.info({ purged, retentionDays: config.RETENTION_DAYS }, 'expired document purge');
  return purged;
}
