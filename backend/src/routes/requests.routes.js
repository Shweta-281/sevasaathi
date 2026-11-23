import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { audit } from '../middleware/audit.js';
import * as svc from '../services/request.service.js';

const router = Router();

const createSchema = z.object({
  serviceId: z.string().min(1),
  formData: z.record(z.any()),
  consent: z.boolean(),
});

router.post('/', requireAuth, validate(createSchema), async (req, res, next) => {
  try { res.status(201).json(await svc.createRequest(req.user.id, req.body)); } catch (e) { next(e); }
});
router.get('/summary', requireAuth, async (req, res, next) => {
  try { res.json(await svc.summarizeMine(req.user.id)); } catch (e) { next(e); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMine(req.user.id)); } catch (e) { next(e); }
});
router.get('/track/:trackingNumber', async (req, res, next) => {
  try { res.json(await svc.trackPublic(req.params.trackingNumber)); } catch (e) { next(e); }
});
router.get('/admin', requireAuth, requireRole('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { status, serviceId, q, page = 1, pageSize = 20 } = req.query;
    res.json(await svc.listForAdmin({
      status, serviceId, q,
      page: Number(page),
      pageSize: Math.min(100, Number(pageSize)),
    }));
  } catch (e) { next(e); }
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED']),
  reason: z.string().max(500).optional(),
});

router.patch('/:id/status', requireAuth, requireRole('ADMIN', 'STAFF'),
  validate(statusSchema),
  audit('request.status.update', {
    target: (req) => ({ type: 'Request', id: req.params.id }),
    metadata: (req) => ({ status: req.body.status }),
  }),
  async (req, res, next) => {
    try { res.json(await svc.updateStatus(req.params.id, req.body)); } catch (e) { next(e); }
  });

export default router;
