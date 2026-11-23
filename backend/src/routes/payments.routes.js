import { Router } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { audit } from '../middleware/audit.js';
import * as svc from '../services/payment.service.js';
import prisma from '../lib/prisma.js';
import { formatINR } from '../utils/money.js';

const router = Router();

const orderSchema = z.object({ requestId: z.string().min(1) });
router.post('/razorpay/order', requireAuth, validate(orderSchema), async (req, res, next) => {
  try { res.json(await svc.createOrderForRequest(req.body.requestId, req.user.id)); } catch (e) { next(e); }
});

// Webhook: req.body is already a raw Buffer (see app.js)
router.post('/razorpay/webhook', async (req, res, next) => {
  try {
    await svc.verifyWebhook(req.body, req.get('x-razorpay-signature') || '');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

const counterPaySchema = z.object({
  requestId: z.string().min(1),
  method: z.enum(['CASH', 'UPI']),
  notes: z.string().max(500).optional(),
});
router.post('/counter', requireAuth, requireRole('STAFF', 'ADMIN'),
  validate(counterPaySchema),
  audit('payment.counter', { target: (req) => ({ type: 'Request', id: req.body.requestId }) }),
  async (req, res, next) => {
    try { res.json(await svc.recordCounterPayment(req.body.requestId, req.body, req.user)); } catch (e) { next(e); }
  });

// Add this route for the Demo Payment
router.post('/demo', requireAuth, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const r = await prisma.request.findUnique({ where: { id: requestId } });
    
    if (!r) throw new Error('Request not found');
    if (r.paidAt) throw new Error('Already paid');

    const receiptNumber = `DEMO-${Date.now()}`;

    // Update payment and request
    await prisma.$transaction([
      prisma.payment.upsert({
        where: { requestId },
        create: { requestId, amountPaise: r.amountPaise, method: 'UPI', status: 'PAID', receiptNumber, notes: 'Demo Payment' },
        update: { method: 'UPI', status: 'PAID', receiptNumber, notes: 'Demo Payment' },
      }),
      prisma.request.update({ where: { id: requestId }, data: { paidAt: new Date() } }),
    ]);

    res.json({ ok: true, receiptNumber });
  } catch (e) {
    next(e);
  }
});







router.get('/:requestId/receipt.pdf', requireAuth, async (req, res, next) => {
  try {
    const r = await prisma.request.findUnique({
      where: { id: req.params.requestId },
      include: { payment: true, service: true, user: true },
    });
    if (!r || !r.payment || r.payment.status !== 'PAID') {
      return res.status(404).json({ error: 'Receipt not available', code: 'NOT_FOUND' });
    }
    if (req.user.role === 'CUSTOMER' && r.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="receipt-${r.payment.receiptNumber || r.id}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(18).text('SevaSaathi – Payment Receipt', { align: 'center' }).moveDown();
    doc.fontSize(11);
    doc.text(`Receipt #: ${r.payment.receiptNumber || '-'}`);
    doc.text(`Tracking #: ${r.trackingNumber}`);
    doc.text(`Service: ${r.service.name}`);
    doc.text(`Customer: ${r.user.email}`);
    doc.text(`Amount: ${formatINR(r.payment.amountPaise)}`);
    doc.text(`Method: ${r.payment.method}`);
    doc.text(`Status: ${r.payment.status}`);
    doc.text(`Date: ${new Date(r.payment.createdAt).toISOString()}`);
    doc.end();
  } catch (e) { next(e); }
});

export default router;
