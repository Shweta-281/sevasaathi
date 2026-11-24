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

const homeDeliverySchema = z.object({ address: z.string().trim().min(10).max(500) });
router.post('/:id/home-delivery', requireAuth, validate(homeDeliverySchema), async (req, res, next) => {
  try { res.json(await svc.requestHomeDelivery(req.params.id, req.user.id, req.body.address)); } catch (e) { next(e); }
});

const feedbackSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(500).optional() });
router.post('/:id/feedback', requireAuth, validate(feedbackSchema), async (req, res, next) => {
  try { res.status(201).json(await svc.submitFeedback(req.params.id, req.user.id, req.body)); } catch (e) { next(e); }
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED']),
  reason: z.string().max(500).optional(),
  completionChecklist: z.object({ detailsVerified: z.boolean(), documentsReviewed: z.boolean(), officialRecordPrepared: z.boolean() }).optional(),
});

const deliverySchema = z.object({
  status: z.enum(['DISPATCHED', 'DELIVERED']),
  carrier: z.string().trim().min(2).max(100),
  trackingNumber: z.string().trim().max(100).optional(),
  trackingUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Tracking link must use HTTPS').optional(),
});
router.patch('/:id/delivery', requireAuth, requireRole('ADMIN', 'STAFF'), validate(deliverySchema),
  audit('request.delivery.update', { target: (req) => ({ type: 'Request', id: req.params.id }) }),
  async (req, res, next) => {
    try { res.json(await svc.updateDelivery(req.params.id, req.body)); } catch (e) { next(e); }
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
