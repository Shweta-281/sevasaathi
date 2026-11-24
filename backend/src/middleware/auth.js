import { verifyAccess } from '../utils/jwt.js';
import { Errors } from '../lib/errors.js';
import prisma from '../lib/prisma.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw Errors.unauthorized('Missing access token', 'NO_TOKEN');
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw Errors.unauthorized('Invalid session', 'INVALID_SESSION');
    if (!user.active) throw Errors.forbidden('Account deactivated', 'ACCOUNT_DEACTIVATED');
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return next(Errors.unauthorized('Access token expired', 'TOKEN_EXPIRED'));
    if (e.name === 'JsonWebTokenError') return next(Errors.unauthorized('Invalid token', 'INVALID_TOKEN'));
    next(e);
  }
}
