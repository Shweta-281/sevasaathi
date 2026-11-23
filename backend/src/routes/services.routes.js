import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { audit } from '../middleware/audit.js';
import * as svc from '../services/service.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, q } = req.query;
    res.json(await svc.listServices({ category, q }));
  } catch (e) { next(e); }
});
router.get('/:slug', async (req, res, next) => {
  try { res.json(await svc.getServiceBySlug(req.params.slug)); } catch (e) { next(e); }
});

const serviceSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  description: z.string().min(5).max(1000),
  feePaise: z.coerce.number().int().min(0),
  requiredDocuments: z.array(z.string().min(1).max(80)).default([]),
  formSchema: z.object({ fields: z.array(z.any()) }).default({ fields: [] }),
  active: z.boolean().default(true),
});

router.post('/', requireAuth, requireRole('ADMIN'), validate(serviceSchema),
  audit('service.create', { target: (_req, body) => ({ type: 'Service', id: body?.id }) }),
  async (req, res, next) => {
    try { res.status(201).json(await svc.createService(req.body)); } catch (e) { next(e); }
  });
router.patch('/:id', requireAuth, requireRole('ADMIN'), validate(serviceSchema.partial()),
  audit('service.update', { target: (req) => ({ type: 'Service', id: req.params.id }) }),
  async (req, res, next) => {
    try { res.json(await svc.updateService(req.params.id, req.body)); } catch (e) { next(e); }
  });
router.delete('/:id', requireAuth, requireRole('ADMIN'),
  audit('service.delete', { target: (req) => ({ type: 'Service', id: req.params.id }) }),
  async (req, res, next) => {
    try { await svc.deleteService(req.params.id); res.json({ ok: true }); } catch (e) { next(e); }
  });

export default router;