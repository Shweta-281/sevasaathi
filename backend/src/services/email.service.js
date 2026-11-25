import { Resend } from 'resend';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

// Initialize Resend if API key is present
const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

const templates = {
  'reset-password': (v) => ({
    subject: 'Reset your SevaSaathi password',
    html: `<p>Hi ${v.name},</p><p>Reset link: <a href="${v.link}">Reset password</a></p><p>Expires in 1 hour.</p>`,
  }),
  
  // UPDATED: Enhanced 'status-changed' template for Certificate/Completion
  'status-changed': (v) => {
    if (v.status === 'COMPLETED' || v.status === 'CERTIFICATE_READY') {
      return {
        subject: `Your Request ${v.trackingNumber} is Complete!`,
        html: `<p>Hi ${v.name},</p>
               <p>Great news! Your ${v.service || 'service'} application <b>${v.trackingNumber}</b> is complete and your certificate is ready.</p>
               <p>Sign in to SevaSaathi to view your completion record, download your receipt, and request home delivery if available.</p>
               <p><i>This portal record is not an official government certificate or card.</i></p>`
      };
    }
    // Default status change email
    return {
      subject: `Request ${v.trackingNumber} – ${v.status}`,
      html: `<p>Hi ${v.name},</p><p>Request <b>${v.trackingNumber}</b> status: <b>${v.status}</b>.</p>${v.reason ? `<p>Reason: ${v.reason}</p>` : ''}`,
    };
  },

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

  if (!resend) {
    logger.info({ to, subject: payload.subject }, '[email:dev] would send (Resend API key missing)');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      // You can change this to 'SevaSaathi <no-reply@yourdomain.com>' once your domain is verified
      from: config.MAIL_FROM || 'SevaSaathi <onboarding@resend.dev>', 
      to: [to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      logger.error({ err: error, to }, 'email failed via Resend');
      return false;
    }

    logger.info({ id: data?.id, to }, 'email sent successfully via Resend');
    return true;
  } catch (e) {
    logger.error({ err: e, to }, 'email failed (exception)');
    return false;
  }
}