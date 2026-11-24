import prisma from '../lib/prisma.js';

const timeZone = 'Asia/Kolkata';

function indiaDateParts(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
}

function localDayWindow(now = new Date()) {
  const parts = indiaDateParts(now);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const start = new Date(`${date}T00:00:00+05:30`);
  return { date, start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

const queuePriority = { PENDING: 0, IN_PROGRESS: 1, PROCESSING: 2, READY_FOR_PICKUP: 3, DOCUMENTS_PENDING: 4 };

export async function getStaffDashboard() {
  const { date, start, end } = localDayWindow();
  const queueStatuses = Object.keys(queuePriority);
  const now = new Date();
  const [statusGroups, requestsToday, appointmentsToday, upcomingAppointments, paidToday, queue, overdueCount] = await Promise.all([
    prisma.request.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.request.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.appointment.count({ where: { date, status: 'BOOKED' } }),
    prisma.appointment.findMany({
      where: { date: { gte: date }, status: 'BOOKED' },
      select: {
        id: true, date: true, slot: true,
        user: { select: { fullName: true, email: true } },
        service: { select: { name: true } },
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
      take: 50,
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID', updatedAt: { gte: start, lt: end } },
      _sum: { amountPaise: true }, _count: { _all: true },
    }),
    prisma.request.findMany({
      where: { status: { in: queueStatuses } },
      select: {
        id: true, trackingNumber: true, status: true, statusReason: true, createdAt: true, dueAt: true,
        user: { select: { fullName: true, email: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }),
    prisma.request.count({ where: { dueAt: { lt: now }, status: { notIn: ['COMPLETED', 'REJECTED'] } } }),
  ]);

  const byStatus = Object.fromEntries(statusGroups.map(({ status, _count }) => [status, _count._all]));
  queue.sort((left, right) => queuePriority[left.status] - queuePriority[right.status] || new Date(left.createdAt) - new Date(right.createdAt));

  return {
    date,
    counts: {
      submitted: byStatus.PENDING || 0,
      processing: (byStatus.IN_PROGRESS || 0) + (byStatus.PROCESSING || 0),
      documentsPending: byStatus.DOCUMENTS_PENDING || 0,
      overdue: overdueCount,
      readyForPickup: byStatus.READY_FOR_PICKUP || 0,
      completed: byStatus.COMPLETED || 0,
      requestsToday,
      appointmentsToday,
      paymentsToday: paidToday._count._all,
      revenueTodayPaise: paidToday._sum.amountPaise || 0,
    },
    queue: queue.slice(0, 10).map((request) => ({
      ...request,
      customerName: request.user.fullName || request.user.email,
      customerEmail: request.user.email,
      serviceName: request.service.name,
      priority: queuePriority[request.status],
    })),
    appointments: upcomingAppointments.map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      slot: appointment.slot,
      customerName: appointment.user.fullName || appointment.user.email,
      serviceName: appointment.service.name,
    })),
  };
}
