import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message, code: err.code, ...(err.details ? { details: err.details } : {}),
    });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.flatten() });
  }
  if (err?.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? 'Uploaded file exceeds the size limit' : 'Upload could not be accepted',
      code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
    });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate value', code: 'CONFLICT' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found', code: 'NOT_FOUND' });
  }
  logger.error({ err, path: req.path, method: req.method }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
