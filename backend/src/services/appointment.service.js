import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';

const SLOTS = [
  '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
  '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
];
const DAILY_CAPACITY = 20;

function todayInIndia() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const listSlots = () => SLOTS;

export async function availability(date) {
  const bookings = await prisma.appointment.groupBy({
    by: ['slot'], where: { date, status: 'BOOKED' }, _count: { _all: true },
  });
  const counts = Object.fromEntries(bookings.map((b) => [b.slot, b._count._all]));
  const total = bookings.reduce((s, b) => s + b._count._all, 0);
  return {
    date,
    slots: SLOTS.map((slot) => ({ slot, available: (counts[slot] || 0) < 1 })),
    dailyCapacity: DAILY_CAPACITY,
    dailyBooked: total,
    dailyAvailable: Math.max(0, DAILY_CAPACITY - total),
  };
}

export async function book(userId, { serviceId, date, slot, notes }) {
  if (!SLOTS.includes(slot)) throw Errors.badRequest('Invalid slot');
  if (date < todayInIndia()) throw Errors.badRequest('Appointment date cannot be in the past');
  if (await prisma.appointment.count({ where: { date, status: 'BOOKED' } }) >= DAILY_CAPACITY) {
    throw Errors.conflict('Date is full', 'DATE_FULL');
  }
  const taken = await prisma.appointment.findFirst({ where: { date, slot, status: 'BOOKED' } });
  if (taken) throw Errors.conflict('Slot taken', 'SLOT_TAKEN');
  return prisma.appointment.create({
    data: { userId, serviceId, date, slot, notes: notes || null },
  });
}

export async function listMine(userId) {
  return prisma.appointment.findMany({
    where: { userId },
    include: { service: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancel(id, userId) {
  const a = await prisma.appointment.findUnique({ where: { id } });
  if (!a) throw Errors.notFound('Appointment not found');
  if (a.userId !== userId) throw Errors.forbidden();
  if (a.status !== 'BOOKED') throw Errors.badRequest('Cannot cancel', 'INVALID_STATE');
  return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
}

export async function reschedule(id, userId, { date, slot, notes }) {
  if (!SLOTS.includes(slot)) throw Errors.badRequest('Invalid slot');
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw Errors.notFound('Appointment not found');
  if (appointment.userId !== userId) throw Errors.forbidden();
  if (appointment.status !== 'BOOKED') throw Errors.badRequest('Cannot reschedule', 'INVALID_STATE');
  const today = todayInIndia();
  if (date < today) throw Errors.badRequest('Appointment date cannot be in the past');

  const [taken, dailyCount] = await Promise.all([
    prisma.appointment.findFirst({ where: { date, slot, status: 'BOOKED', id: { not: id } } }),
    prisma.appointment.count({ where: { date, status: 'BOOKED', id: { not: id } } }),
  ]);
  if (taken) throw Errors.conflict('Slot taken', 'SLOT_TAKEN');
  if (dailyCount >= DAILY_CAPACITY) throw Errors.conflict('Date is full', 'DATE_FULL');

  return prisma.appointment.update({
    where: { id },
    data: { date, slot, notes: notes ?? appointment.notes },
    include: { service: { select: { id: true, name: true } } },
  });
}
