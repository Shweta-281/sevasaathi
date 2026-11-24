import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';
import { sendEmail } from '../services/email.service.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60_000, max: 5 });
const enquirySchema = z.object({
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
});

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

router.get('/contact', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ email: config.SUPPORT_EMAIL || null, emailEnabled: Boolean(config.SUPPORT_EMAIL && config.SMTP_HOST) });
});

router.post('/enquiries', requireAuth, limiter, validate(enquirySchema), async (req, res, next) => {
  try {
    if (!config.SUPPORT_EMAIL || !config.SMTP_HOST) throw Errors.internal('Support email is not configured', 'SUPPORT_UNAVAILABLE');
    const subject = req.body.subject.replace(/[\r\n]+/g, ' ').trim();
    const message = escapeHtml(req.body.message).replace(/\r?\n/g, '<br>');
    const sent = await sendEmail({
      to: config.SUPPORT_EMAIL,
      subject: `SevaSaathi enquiry: ${subject}`,
      html: `<p>From: ${escapeHtml(req.user.email)}</p><p>Subject: ${escapeHtml(subject)}</p><p>${message}</p>`,
    });
    if (!sent) throw Errors.internal('Support email could not be delivered', 'SUPPORT_DELIVERY_FAILED');
    res.status(202).json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
