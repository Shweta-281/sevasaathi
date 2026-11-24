import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

let transporter = null;
if (config.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
}

const templates = {
  'reset-password': (v) => ({
    subject: 'Reset your SevaSaathi password',
    html: `<p>Hi ${v.name},</p><p>Reset link: <a href="${v.link}">Reset password</a></p><p>Expires in 1 hour.</p>`,
  }),
  'status-changed': (v) => ({
    subject: `Request ${v.trackingNumber} – ${v.status}`,
    html: v.status === 'COMPLETED'
      ? `<p>Hi ${v.name},</p><p>Your ${v.service || 'service'} application <b>${v.trackingNumber}</b> is complete. Sign in to SevaSaathi to view your completion record and request home delivery if available.</p><p>This portal record is not an official government certificate or card.</p>`
      : `<p>Hi ${v.name},</p><p>Request <b>${v.trackingNumber}</b> status: <b>${v.status}</b>.</p>${v.reason ? `<p>Reason: ${v.reason}</p>` : ''}`,
  }),
  'home-delivery-requested': (v) => ({
    subject: `Home delivery requested for ${v.trackingNumber}`,
    html: `<p>Hi ${v.name},</p><p>Your home delivery request for <b>${v.service}</b> (${v.trackingNumber}) has been received.</p><p>Requested address: ${v.address}</p><p>Our team will contact you to confirm delivery arrangements. This is a request, not a dispatch confirmation.</p>`,
  }),
  'documents-received': (v) => ({
    subject: `Documents received for request ${v.trackingNumber}`,
    html: `<p>Hi ${v.name},</p><p>We received your additional documents for request <b>${v.trackingNumber}</b>. They will remain under review until the service team verifies them. You can check your request for updates.</p>`,
  }),
  'payment-receipt': (v) => ({
    subject: `Receipt ${v.receiptNumber} – SevaSaathi`,
    html: `<p>Payment received for <b>${v.trackingNumber}</b>.</p><p>Amount: ₹${v.amount}</p><p>Receipt: ${v.receiptNumber}</p>`,
  }),
};

export async function sendEmail({ to, template, vars, subject, html }) {
  const payload = template
    ? templates[template](vars || {})
    : { subject, html };
  if (!transporter) {
    logger.info({ to, subject: payload.subject }, '[email:dev] would send');
    return false;
  }
  try {
    await transporter.sendMail({ from: config.MAIL_FROM, to, subject: payload.subject, html: payload.html });
    return true;
  } catch (e) {
    logger.error({ err: e, to }, 'email failed');
    return false;
  }
}
