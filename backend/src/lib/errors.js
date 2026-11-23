export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500, details) {
    super(message);
    this.code = code; this.status = status; this.details = details; this.isOperational = true;
  }
}

export const Errors = {
  badRequest: (msg = 'Bad request', code = 'BAD_REQUEST', details) => new AppError(msg, code, 400, details),
  unauthorized: (msg = 'Unauthorized', code = 'UNAUTHORIZED') => new AppError(msg, code, 401),
  forbidden: (msg = 'Forbidden', code = 'FORBIDDEN') => new AppError(msg, code, 403),
  notFound: (msg = 'Not found', code = 'NOT_FOUND') => new AppError(msg, code, 404),
  conflict: (msg = 'Conflict', code = 'CONFLICT') => new AppError(msg, code, 409),
  tooMany: (msg = 'Too many requests', code = 'RATE_LIMITED') => new AppError(msg, code, 429),
  internal: (msg = 'Internal server error', code = 'INTERNAL_ERROR') => new AppError(msg, code, 500),
};