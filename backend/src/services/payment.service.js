import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';
import { sendEmail } from './email.service.js';
import { logger } from '../lib/logger.js';

const razorpay = (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: config.RAZORPAY_KEY_ID, key_secret: config.RAZORPAY_KEY_SECRET })
  : null;

async function nextReceiptNumber() {
  const c = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { name: 'receipt' } });
    return existing
      ? tx.counter.update({ where: { name: 'receipt' }, data: { value: { increment: 1 } } })
      : tx.counter.create({ data: { name: 'receipt', value: 1 } });
  });
  return `RC-${new Date().getFullYear()}-${String(c.value).padStart(6, '0')}`;
}

export async function createOrderForRequest(requestId, userId) {
  if (!razorpay) throw Errors.internal('Razorpay not configured', 'PAYMENT_DISABLED');
  const r = await prisma.request.findUnique({ where: { id: requestId } });
  if (!r) throw Errors.notFound('Request not found');
  if (r.userId !== userId) throw Errors.forbidden();
  if (r.paidAt) throw Errors.conflict('Already paid', 'ALREADY_PAID');
  const order = await razorpay.orders.create({
    amount: r.amountPaise,
    currency: 'INR',
    receipt: r.trackingNumber,
    notes: { requestId: r.id },
  });
  await prisma.payment.upsert({
    where: { requestId },
    create: { requestId, orderId: order.id, amountPaise: r.amountPaise, method: 'RAZORPAY', status: 'PENDING' },
    update: { orderId: order.id, status: 'PENDING' },
  });
  return { orderId: order.id, amount: r.amountPaise, currency: 'INR', keyId: config.RAZORPAY_KEY_ID };
}

export async function verifyWebhook(rawBody, signature) {
  if (!config.RAZORPAY_WEBHOOK_SECRET) throw Errors.internal('Webhook secret not configured');
  const expected = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  if (expected !== signature) throw Errors.badRequest('Invalid signature', 'BAD_SIGNATURE');
  const event = JSON.parse(rawBody.toString('utf8'));
  if (event.event !== 'payment.captured') return;
  const p = event.payload.payment.entity;
  const requestId = p.notes?.requestId;
  if (!requestId) return;
  const receiptNumber = await nextReceiptNumber();
  await prisma.$transaction([
    prisma.payment.update({
      where: { requestId },
      data: { paymentId: p.id, status: 'PAID', receiptNumber },
    }),
    prisma.request.update({ where: { id: requestId }, data: { paidAt: new Date() } }),
  ]);
  const r = await prisma.request.findUnique({ where: { id: requestId }, include: { user: true } });
  if (r) sendEmail({
    to: r.user.email,
    template: 'payment-receipt',
    vars: { trackingNumber: r.trackingNumber, amount: (r.amountPaise / 100).toFixed(2), receiptNumber },
  });
  logger.info({ requestId, receiptNumber }, 'payment captured');
}

export async function recordCounterPayment(requestId, { method, notes }, staff) {
  const r = await prisma.request.findUnique({ where: { id: requestId } });
  if (!r) throw Errors.notFound('Request not found');
  if (r.paidAt) throw Errors.conflict('Already paid', 'ALREADY_PAID');
  if (!['CASH', 'UPI'].includes(method)) throw Errors.badRequest('Invalid method');
  const receiptNumber = await nextReceiptNumber();
  const [payment] = await prisma.$transaction([
    prisma.payment.upsert({
      where: { requestId },
      create: { requestId, amountPaise: r.amountPaise, method, status: 'PAID', receiptNumber, notes: notes || null, createdByStaffId: staff.id },
      update: { method, status: 'PAID', receiptNumber, notes: notes || null, createdByStaffId: staff.id },
    }),
    prisma.request.update({ where: { id: requestId }, data: { paidAt: new Date() } }),
  ]);
  return payment;
}