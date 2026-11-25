import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { nextTrackingNumber } from '../utils/tracking.js';
import { validateFormData } from '../utils/validateForm.js';
import { encryptAadhaar, decryptAadhaar, maskAadhaar } from '../utils/crypto.js';
import { sendEmail } from './email.service.js';
import { config } from '../config.js';
import { RequestStatuses } from '../constants/enums.js';
import { createNotification } from './notification.service.js';

function present(r) {
  const formData = JSON.parse(r.formData || '{}');
  const aadhaarField = r.service ? JSON.parse(r.service.formSchema || '{"fields":[]}').fields?.find((field) => field.type === 'aadhaar')?.name : 'aadhaar';
  const out = {
    id: r.id,
    trackingNumber: r.trackingNumber,
    serviceId: r.serviceId,
    service: r.service ? {
      id: r.service.id,
      name: r.service.name,
      slug: r.service.slug,
      category: r.service.category,
      expectedProcessingDays: r.service.expectedProcessingDays,
      requiredDocuments: JSON.parse(r.service.requiredDocuments || '[]'),
    } : undefined,
    applicantName: r.user?.fullName || null,
    applicantAddress: r.user?.address || null,
    status: r.status,
    statusReason: r.statusReason,
    amountPaise: r.amountPaise,
    paidAt: r.paidAt,
    deliveryStatus: r.deliveryStatus || 'NOT_REQUESTED',
    deliveryAddress: r.deliveryAddress || null,
    deliveryRequestedAt: r.deliveryRequestedAt || null,
    deliveryCarrier: r.deliveryCarrier || null,
    deliveryTrackingNumber: r.deliveryTrackingNumber || null,
    deliveryTrackingUrl: r.deliveryTrackingUrl || null,
    completionChecklist: r.completionChecklist ? JSON.parse(r.completionChecklist) : null,
    events: r.events || [],
    feedback: r.feedback || null,
    consentAt: r.consentAt,
    consentVersion: r.consentVersion,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    dueAt: r.dueAt || null,
    formData,
  };
  if (r.aadhaarEncrypted) {
    out.formData = { ...formData, [aadhaarField || 'aadhaar']: maskAadhaar(decryptAadhaar(r.aadhaarEncrypted)) };
  }
  if (r.documents) out.documents = r.documents;
  return out;
}

export async function createRequest(userId, { serviceId, formData, consent }) {
  if (!consent) throw Errors.badRequest('Consent required', 'CONSENT_REQUIRED');
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) throw Errors.notFound('Service not found', 'SERVICE_NOT_FOUND');

  const validated = validateFormData(service.formSchema, formData);
  let aadhaarEncrypted = null;
  const aadhaarField = JSON.parse(service.formSchema || '{"fields":[]}').fields?.find((field) => field.type === 'aadhaar')?.name;
  if (aadhaarField && validated[aadhaarField]) {
    aadhaarEncrypted = encryptAadhaar(validated[aadhaarField]);
    delete validated[aadhaarField];
  }

  const trackingNumber = await nextTrackingNumber();
  const dueAt = new Date(Date.now() + (service.expectedProcessingDays || 7) * 24 * 60 * 60 * 1000);
  const created = await prisma.request.create({
    data: {
      trackingNumber, userId, serviceId,
      status: 'PENDING',
      formData: JSON.stringify(validated),
      aadhaarEncrypted,
      consentAt: new Date(),
      consentVersion: config.CONSENT_VERSION,
      amountPaise: service.feePaise,
      dueAt,
      events: { create: { type: 'STATUS', status: 'PENDING', note: 'Application submitted' } },
    },
    include: { service: true, documents: true, events: true, user: { select: { fullName: true, address: true } } },
  });
  return present(created);
}

export async function listMine(userId) {
  const items = await prisma.request.findMany({
    where: { userId },
    include: { service: true, documents: true, events: { orderBy: { createdAt: 'asc' } }, feedback: true, user: { select: { fullName: true, address: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return items.map(present);
}

export async function summarizeMine(userId) {
  const [groups, firstAction] = await Promise.all([
    prisma.request.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.request.findFirst({
      where: { userId, status: 'DOCUMENTS_PENDING' },
      include: { service: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  const byStatus = Object.fromEntries(groups.map(({ status, _count }) => [status, _count._all]));
  return {
    total: groups.reduce((sum, group) => sum + group._count._all, 0),
    byStatus,
    actionRequired: {
      count: byStatus.DOCUMENTS_PENDING || 0,
      first: firstAction ? {
        id: firstAction.id,
        trackingNumber: firstAction.trackingNumber,
        serviceName: firstAction.service.name,
        statusReason: firstAction.statusReason,
      } : null,
    },
  };
}

export async function trackPublic(trackingNumber) {
  const r = await prisma.request.findUnique({ where: { trackingNumber }, include: { service: true } });
  if (!r) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
  return {
    trackingNumber: r.trackingNumber,
    service: r.service.name,
    status: r.status,
    statusReason: r.statusReason,
    updatedAt: r.updatedAt,
  };
}

async function getByIdOrThrow(id) {
  const r = await prisma.request.findUnique({
    where: { id },
    include: { service: true, documents: true, payment: true },
  });
  if (!r) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
  return r;
}

export async function listForAdmin({ status, serviceId, q, page = 1, pageSize = 20 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (serviceId) where.serviceId = serviceId;
  if (q) where.OR = [
    { trackingNumber: { contains: q } },
    { formData: { contains: q } },
    { user: { is: { email: { contains: q } } } },
    { user: { is: { fullName: { contains: q } } } },
  ];
  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: { service: true, user: { select: { id: true, email: true, fullName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.request.count({ where }),
  ]);
  return {
    items: items.map((r) => ({
      id: r.id, trackingNumber: r.trackingNumber, status: r.status,
      deliveryStatus: r.deliveryStatus, deliveryCarrier: r.deliveryCarrier,
      deliveryTrackingNumber: r.deliveryTrackingNumber, deliveryTrackingUrl: r.deliveryTrackingUrl,
      service: { id: r.service.id, name: r.service.name },
      user: r.user, createdAt: r.createdAt,
    })),
    total, page, pageSize,
  };
}

export async function updateStatus(id, { status, reason, completionChecklist }) {
  const parsed = RequestStatuses.safeParse(status);
  if (!parsed.success) throw Errors.badRequest('Invalid status', 'INVALID_STATUS');
  const checklistItems = ['detailsVerified', 'documentsReviewed', 'officialRecordPrepared'];
  if (status === 'COMPLETED' && checklistItems.some((item) => completionChecklist?.[item] !== true)) {
    throw Errors.badRequest('Complete every staff checklist item before marking this request complete', 'COMPLETION_CHECKLIST_REQUIRED');
  }
  const previous = await prisma.request.findUnique({ where: { id }, select: { status: true } });
  if (!previous) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
  const updated = await prisma.$transaction(async (tx) => {
    const request = await tx.request.update({
      where: { id },
      data: { status, statusReason: reason || null, ...(status === 'COMPLETED' ? { completionChecklist: JSON.stringify(completionChecklist) } : {}) },
      include: { service: true, user: true, documents: true },
    });
    await tx.requestEvent.create({ data: { requestId: id, type: 'STATUS', status, note: reason || null } });
    return request;
  });
  
  // This block triggers the email. If status is COMPLETED, the updated email.js will send the Certificate message.
  if (previous.status !== status && updated.user.emailNotifications) {
    sendEmail({
      to: updated.user.email,
      template: 'status-changed',
      vars: { 
        name: updated.user.fullName || updated.user.email, 
        trackingNumber: updated.trackingNumber, 
        service: updated.service.name, 
        status: updated.status, 
        reason: updated.statusReason 
      },
    });
  }
  
  if (previous.status !== status) await createNotification(updated.userId, {
    title: `Request ${status.toLowerCase().replaceAll('_', ' ')}`,
    message: `${updated.service.name} (${updated.trackingNumber}) is now ${status.toLowerCase().replaceAll('_', ' ')}.${reason ? ` ${reason}` : ''}`,
    link: `/app/requests/${updated.id}`,
  });
  return present({ ...updated, events: await prisma.requestEvent.findMany({ where: { requestId: id }, orderBy: { createdAt: 'asc' } }) });
}

export async function requestHomeDelivery(id, userId, address) {
  const request = await prisma.request.findUnique({ where: { id }, include: { user: true, service: true } });
  if (!request || request.userId !== userId) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
  if (request.status !== 'COMPLETED') throw Errors.badRequest('Home delivery is available after completion', 'REQUEST_NOT_COMPLETED');
  if (request.deliveryStatus !== 'NOT_REQUESTED') throw Errors.badRequest('Home delivery has already been requested', 'DELIVERY_ALREADY_REQUESTED');
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.request.update({
    where: { id },
    data: { deliveryStatus: 'REQUESTED', deliveryAddress: address, deliveryRequestedAt: new Date() },
      include: { service: true, documents: true, user: { select: { fullName: true, address: true } } },
    });
    await tx.requestEvent.create({ data: { requestId: id, type: 'DELIVERY', status: 'REQUESTED', note: 'Home delivery requested' } });
    return result;
  });
  if (request.user.emailNotifications) sendEmail({ to: request.user.email, template: 'home-delivery-requested', vars: {
    name: request.user.fullName || request.user.email, trackingNumber: request.trackingNumber,
    service: request.service.name, address,
  } });
  await createNotification(userId, { title: 'Home delivery requested', message: `Delivery requested for ${request.service.name} (${request.trackingNumber}).`, link: `/app/requests/${id}` });
  if (config.SUPPORT_EMAIL) sendEmail({ to: config.SUPPORT_EMAIL, subject: `Home delivery requested: ${request.trackingNumber}`,
    html: `<p>Home delivery requested for ${request.service.name} (${request.trackingNumber}) by ${request.user.fullName || request.user.email}.</p><p>Address: ${address}</p>` });
  return present({ ...updated, events: await prisma.requestEvent.findMany({ where: { requestId: id }, orderBy: { createdAt: 'asc' } }) });
}

export async function updateDelivery(id, { status, carrier, trackingNumber, trackingUrl }) {
  const request = await prisma.request.findUnique({ where: { id }, select: { id: true, deliveryStatus: true } });
  if (!request || request.deliveryStatus === 'NOT_REQUESTED') throw Errors.notFound('Delivery request not found', 'DELIVERY_NOT_FOUND');
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.request.update({ where: { id }, data: {
      deliveryStatus: status, deliveryCarrier: carrier, deliveryTrackingNumber: trackingNumber || null,
      deliveryTrackingUrl: trackingUrl || null,
    }, include: { service: true, user: true, documents: true } });
    await tx.requestEvent.create({ data: { requestId: id, type: 'DELIVERY', status, note: `${carrier}${trackingNumber ? ` · ${trackingNumber}` : ''}` } });
    return result;
  });
  if (updated.user.emailNotifications) sendEmail({ to: updated.user.email, subject: `Delivery update for ${updated.trackingNumber}`,
    html: `<p>Your ${updated.service.name} delivery is now ${status.toLowerCase()}.</p><p>Carrier: ${carrier}${trackingNumber ? ` · Tracking number: ${trackingNumber}` : ''}</p>${trackingUrl ? `<p><a href="${trackingUrl}">Track delivery</a></p>` : ''}` });
  await createNotification(updated.userId, { title: `Delivery ${status.toLowerCase()}`, message: `${updated.service.name} (${updated.trackingNumber}) delivery is ${status.toLowerCase()}.`, link: `/app/requests/${id}` });
  return present({ ...updated, events: await prisma.requestEvent.findMany({ where: { requestId: id }, orderBy: { createdAt: 'asc' } }) });
}

export async function submitFeedback(id, userId, { rating, comment }) {
  const request = await prisma.request.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  if (!request || request.userId !== userId) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
  if (request.status !== 'COMPLETED') throw Errors.badRequest('Feedback is available after completion', 'REQUEST_NOT_COMPLETED');
  try { return await prisma.feedback.create({ data: { requestId: id, userId, rating, comment: comment?.trim() || null } }); }
  catch (error) { if (error.code === 'P2002') throw Errors.conflict('Feedback has already been submitted', 'FEEDBACK_EXISTS'); throw error; }
}