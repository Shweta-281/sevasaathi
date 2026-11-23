import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export function audit(action, opts = {}) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    let captured;
    res.json = (body) => { captured = body; return originalJson(body); };
    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      try {
        const target = typeof opts.target === 'function' ? opts.target(req, captured) : opts.target;
        const meta = typeof opts.metadata === 'function' ? opts.metadata(req, captured) : opts.metadata;
        await prisma.auditLog.create({
          data: {
            actorId: req.user?.id || null,
            actorRole: req.user?.role || null,
            action,
            targetType: target?.type || null,
            targetId: target?.id || null,
            metadata: meta ? JSON.stringify(meta) : null,
            ip: req.ip || null,
            userAgent: req.get('user-agent')?.slice(0, 250) || null,
          },
        });
      } catch (e) { logger.error({ err: e }, 'audit failed'); }
    });
    next();
  };
}