import { Router } from 'express';
import path from 'node:path';
import { requireAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import * as svc from '../services/upload.service.js';
import { Errors } from '../lib/errors.js';

const router = Router();

router.post('/requests/:requestId', requireAuth, uploadMiddleware.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files?.length) throw Errors.badRequest('No files uploaded', 'NO_FILES');
    res.status(201).json(await svc.recordUpload(req.params.requestId, req.user.id, req.files, { kind: req.body.kind }));
  } catch (e) { next(e); }
});
router.get('/:docId', requireAuth, async (req, res, next) => {
  try {
    const { doc, path: filePath } = await svc.downloadDocument(req.params.docId, req.user);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(doc.originalName)}"`);
    res.sendFile(path.resolve(filePath));
  } catch (e) { next(e); }
});
router.delete('/:docId', requireAuth, async (req, res, next) => {
  try { await svc.deleteDocument(req.params.docId, req.user); res.json({ ok: true }); } catch (e) { next(e); }
});

export default router;