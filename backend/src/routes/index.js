import { Router } from 'express';
import auth from './auth.routes.js';
import services from './services.routes.js';
import requests from './requests.routes.js';
import uploads from './uploads.routes.js';
import payments from './payments.routes.js';
import appointments from './appointments.routes.js';
import admin from './admin.routes.js';
import support from './support.routes.js';
import prisma from '../lib/prisma.js';
import notifications from './notifications.routes.js';

const router = Router();
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected', ts: Date.now() });
  } catch {
    res.status(503).json({ ok: false, database: 'unavailable' });
  }
});
router.use('/auth', auth);
router.use('/services', services);
router.use('/requests', requests);
router.use('/uploads', uploads);
router.use('/payments', payments);
router.use('/appointments', appointments);
router.use('/admin', admin);
router.use('/support', support);
router.use('/notifications', notifications);
export default router;
