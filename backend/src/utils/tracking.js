import prisma from '../lib/prisma.js';

export async function nextTrackingNumber() {
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { name: 'request' } });
    if (!existing) return tx.counter.create({ data: { name: 'request', value: 1 } });
    return tx.counter.update({ where: { name: 'request' }, data: { value: { increment: 1 } } });
  });
  return `AS-${new Date().getFullYear()}-${String(counter.value).padStart(6, '0')}`;
}