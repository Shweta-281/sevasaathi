import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as svc from '../services/appointment.service.js';

const router = Router();

router.get('/slots', (_req, res) => res.json({ slots: svc.listSlots() }));
router.get('/availability', async (req, res, next) => {
  try {
    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date required (YYYY-MM-DD)', code: 'BAD_REQUEST' });
    }
    res.json(await svc.availability(date));
  } catch (e) { next(e); }
});

const bookSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().min(3).max(20),
  notes: z.string().max(500).optional(),
});
router.post('/', requireAuth, validate(bookSchema), async (req, res, next) => {
  try { res.status(201).json(await svc.book(req.user.id, req.body)); } catch (e) { next(e); }
});
router.patch('/:id', requireAuth, validate(bookSchema), async (req, res, next) => {
  try { res.json(await svc.reschedule(req.params.id, req.user.id, req.body)); } catch (e) { next(e); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try { res.json(await svc.listMine(req.user.id)); } catch (e) { next(e); }
});
router.delete('/:id', requireAuth, async (req, res, next) => {
  try { res.json(await svc.cancel(req.params.id, req.user.id)); } catch (e) { next(e); }
});

export default router;
