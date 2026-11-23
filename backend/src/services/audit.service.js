import prisma from '../lib/prisma.js';

export async function list({ page = 1, pageSize = 50, action, actorId } = {}) {
  const where = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function toCsv(filters) {
  const rows = await prisma.auditLog.findMany({ where: filters, orderBy: { createdAt: 'desc' }, take: 10000 });
  const esc = (v) => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`);
  const header = 'id,createdAt,actorId,actorRole,action,targetType,targetId,ip\n';
  return header + rows.map((r) =>
    [r.id, r.createdAt.toISOString(), r.actorId, r.actorRole, r.action, r.targetType, r.targetId, r.ip].map(esc).join(',')
  ).join('\n');
}