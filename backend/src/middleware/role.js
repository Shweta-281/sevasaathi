import { Errors } from '../lib/errors.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(Errors.unauthorized());
  if (!roles.includes(req.user.role)) return next(Errors.forbidden('Insufficient role'));
  next();
};