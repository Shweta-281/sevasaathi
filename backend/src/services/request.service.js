import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { nextTrackingNumber } from '../utils/tracking.js';
import { validateFormData } from '../utils/validateForm.js';
import { encryptAadhaar, decryptAadhaar, maskAadhaar } from '../utils/crypto.js';
import { sendEmail } from './email.service.js';
import { config } from '../config.js';
import { RequestStatuses } from '../constants/enums.js';

function present(r) {
  const formData = JSON.parse(r.formData || '{}');
  const out = {
    id: r.id,
    trackingNumber: r.trackingNumber,
    serviceId: r.serviceId,
    service: r.service ? {
      id: r.service.id,
      name: r.service.name,
      slug: r.service.slug,
      requiredDocuments: JSON.parse(r.service.requiredDocuments || '[]'),
    } : undefined,
    status: r.status,
    statusReason: r.statusReason,
    amountPaise: r.amountPaise,
    paidAt: r.paidAt,
    consentAt: r.consentAt,
    consentVersion: r.consentVersion,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    formData,
  };
  if (r.aadhaarEncrypted) {
    out.formData = { ...formData, aadhaar: maskAadhaar(decryptAadhaar(r.aadhaarEncrypted)) };
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
  if (validated.aadhaar) {
    aadhaarEncrypted = encryptAadhaar(validated.aadhaar);
    delete validated.aadhaar;
  }

  const trackingNumber = await nextTrackingNumber();
  const created = await prisma.request.create({
    data: {
      trackingNumber, userId, serviceId,
      status: 'PENDING',
      formData: JSON.stringify(validated),
      aadhaarEncrypted,
      consentAt: new Date(),
      consentVersion: config.CONSENT_VERSION,
      amountPaise: service.feePaise,
    },
    include: { service: true, documents: true },
  });
  return present(created);
}

export async function listMine(userId) {
  const items = await prisma.request.findMany({
    where: { userId },
    include: { service: true, documents: true },
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
      service: { id: r.service.id, name: r.service.name },
      user: r.user, createdAt: r.createdAt,
    })),
    total, page, pageSize,
  };
}

export async function updateStatus(id, { status, reason }) {
  const parsed = RequestStatuses.safeParse(status);
  if (!parsed.success) throw Errors.badRequest('Invalid status', 'INVALID_STATUS');
  const updated = await prisma.request.update({
    where: { id },
    data: { status, statusReason: reason || null },
    include: { service: true, user: true, documents: true },
  });
  sendEmail({
    to: updated.user.email,
    template: 'status-changed',
    vars: {
      name: updated.user.fullName || updated.user.email,
      trackingNumber: updated.trackingNumber,
      status: updated.status,
      reason: updated.statusReason,
    },
  });
  return present(updated);
}
