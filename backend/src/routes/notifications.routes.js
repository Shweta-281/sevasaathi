import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as notifications from '../services/notification.service.js';

const router = Router();
router.use(requireAuth);
router.get('/mine', async (req, res, next) => {
  try { res.json(await notifications.listForUser(req.user.id)); } catch (error) { next(error); }
});
router.patch('/:id/read', async (req, res, next) => {
  try { res.json(await notifications.markRead(req.params.id, req.user.id)); } catch (error) { next(error); }
});
router.post('/read-all', async (req, res, next) => {
  try { res.json(await notifications.markAllRead(req.user.id)); } catch (error) { next(error); }
});
export default router;
