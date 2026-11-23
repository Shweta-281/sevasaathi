import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { config } from '../config.js';
import { verifyMagic } from '../middleware/upload.js';
import { sendEmail } from './email.service.js';

const uploadDir = path.resolve(config.UPLOAD_DIR);

export async function recordUpload(requestId, userId, files, { kind } = {}) {
  const req = await prisma.request.findUnique({ where: { id: requestId }, include: { service: true, user: true } });
  if (!req || req.userId !== userId) {
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    if (!req) throw Errors.notFound('Request not found', 'REQUEST_NOT_FOUND');
    throw Errors.forbidden();
  }

  if (kind) {
    const requiredDocuments = JSON.parse(req.service.requiredDocuments || '[]');
    if (!requiredDocuments.includes(kind)) {
      await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
      throw Errors.badRequest('Choose a document type required for this service', 'INVALID_DOCUMENT_KIND');
    }
  }

  if (files.some((file) => !verifyMagic(file, file.mimetype))) {
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    throw Errors.badRequest('File content does not match declared type', 'MAGIC_MISMATCH');
  }

  const results = [];
  for (const file of files) {
    const doc = await prisma.document.create({
      data: {
        requestId,
        originalName: file.originalname.slice(0, 200),
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        kind: kind || null,
      },
    });
    results.push(doc);
  }
  if (req.status === 'DOCUMENTS_PENDING') {
    sendEmail({
      to: req.user.email,
      template: 'documents-received',
      vars: { name: req.user.fullName || req.user.email, trackingNumber: req.trackingNumber },
    });
  }
  return results;
}

function safePath(storedName) {
  const p = path.resolve(uploadDir, storedName);
  if (!p.startsWith(uploadDir + path.sep)) throw Errors.badRequest('Invalid path');
  return p;
}

export async function downloadDocument(docId, user) {
  const doc = await prisma.document.findUnique({ where: { id: docId }, include: { request: true } });
  if (!doc) throw Errors.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
  const isOwner = doc.request.userId === user.id;
  const isStaff = user.role === 'STAFF' || user.role === 'ADMIN';
  if (!isOwner && !isStaff) throw Errors.forbidden();
  return { doc, path: safePath(doc.storedName) };
}

export async function deleteDocument(docId, user) {
  const doc = await prisma.document.findUnique({ where: { id: docId }, include: { request: true } });
  if (!doc) throw Errors.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
  const isOwner = doc.request.userId === user.id;
  const isStaff = user.role === 'STAFF' || user.role === 'ADMIN';
  if (!isOwner && !isStaff) throw Errors.forbidden();
  await fs.unlink(safePath(doc.storedName)).catch(() => {});
  await prisma.document.delete({ where: { id: docId } });
}
