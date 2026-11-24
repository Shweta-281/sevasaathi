import prisma from '../lib/prisma.js';
import { notify } from '../lib/sse.js';

export async function createNotification(userId, { title, message, link }) {
  const item = await prisma.notification.create({ data: { userId, title, message, link } });
  notify(userId, 'notification', item);
  return item;
}

export async function listForUser(userId) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markRead(id, userId) {
  const result = await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  return { ok: true, updated: result.count > 0 };
}

export async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  return { ok: true, updated: result.count };
}
