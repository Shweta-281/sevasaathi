import prisma from '../lib/prisma.js';

export async function dashboard() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86400_000);

  const [total, byStatus, revenue, users, appointments, recent] = await Promise.all([
    prisma.request.count(),
    prisma.request.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amountPaise: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.appointment.count({ where: { date: { gte: now.toISOString().slice(0, 10) } } }),
    prisma.request.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
  ]);

  const daily = {};
  for (const r of recent) {
    const d = r.createdAt.toISOString().slice(0, 10);
    daily[d] = (daily[d] || 0) + 1;
  }

  return {
    totalRequests: total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    revenuePaise: revenue._sum.amountPaise || 0,
    users: Object.fromEntries(users.map((u) => [u.role, u._count._all])),
    upcomingAppointments: appointments,
    lastWeekRequests: await prisma.request.count({ where: { createdAt: { gte: weekAgo } } }),
    dailyRequests: daily,
  };
}