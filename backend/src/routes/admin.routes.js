import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { audit } from '../middleware/audit.js';
import { hashPassword } from '../utils/password.js';
import prisma from '../lib/prisma.js';
import * as analytics from '../services/analytics.service.js';
import * as auditSvc from '../services/audit.service.js';
import * as exportSvc from '../services/adminExport.service.js';
import * as staffDashboard from '../services/staffDashboard.service.js';
import { Errors } from '../lib/errors.js';

const router = Router();
router.use(requireAuth);

router.get('/analytics', requireRole('ADMIN', 'STAFF'), async (_req, res, next) => {
  try { res.json(await analytics.dashboard()); } catch (e) { next(e); }
});
router.get('/staff-dashboard', requireRole('ADMIN', 'STAFF'), async (_req, res, next) => {
  try { res.json(await staffDashboard.getStaffDashboard()); } catch (e) { next(e); }
});

// User management, audit logs, and exports contain admin-only data/actions.
router.use(requireRole('ADMIN'));

router.get('/feedback', async (_req, res, next) => {
  try {
    const items = await prisma.feedback.findMany({ include: { user: { select: { fullName: true, email: true } }, request: { select: { trackingNumber: true, service: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(items);
  } catch (error) { next(error); }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, phone: true, role: true, active: true, createdAt: true, emailVerifiedAt: true }, orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch (error) { next(error); }
});
const updateUserSchema = z.object({ role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']).optional(), active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0);
router.patch('/users/:id', validate(updateUserSchema), audit('user.update', { target: (req) => ({ type: 'User', id: req.params.id }) }), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id && (req.body.active === false || req.body.role && req.body.role !== 'ADMIN')) throw Errors.badRequest('You cannot deactivate or demote your own account');
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw Errors.notFound('User not found', 'USER_NOT_FOUND');
    if (existing.role === 'ADMIN' && req.body.role && req.body.role !== 'ADMIN' && await prisma.user.count({ where: { role: 'ADMIN', active: true } }) <= 1) throw Errors.badRequest('At least one active administrator must remain');
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body, select: { id: true, email: true, fullName: true, role: true, active: true } });
    res.json(user);
  } catch (error) { next(error); }
});

router.get('/exports', (_req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json(exportSvc.listAdminReports());
});
router.get('/exports/:report', async (req, res, next) => {
  try {
    const format = String(req.query.format || 'xlsx').toLowerCase();
    if (!['xlsx', 'pdf'].includes(format)) throw Errors.badRequest('Choose xlsx or pdf format', 'INVALID_EXPORT_FORMAT');
    const report = await exportSvc.buildAdminReport(req.params.report);
    if (!report) throw Errors.notFound('Export report not found', 'REPORT_NOT_FOUND');

    const filename = `sevasaathi-${report.id}-${exportSvc.exportTimestamp()}.${format}`;
    res.set({ 'Cache-Control': 'private, no-store', 'X-Exported-At': report.generatedAt });
    if (format === 'pdf') {
      const pdf = await exportSvc.buildAdminPdf(report);
      res.type('application/pdf').attachment(filename).send(pdf);
    } else {
      const workbook = exportSvc.buildAdminXlsx(report);
      res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment(filename).send(workbook);
    }
  } catch (e) { next(e); }
});
router.get('/audit', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 50, action, actorId } = req.query;
    res.json(await auditSvc.list({
      page: Number(page), pageSize: Math.min(200, Number(pageSize)), action, actorId,
    }));
  } catch (e) { next(e); }
});
router.get('/audit/export.csv', async (req, res, next) => {
  try {
    const { action, actorId } = req.query;
    const csv = await auditSvc.toCsv({
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(['STAFF', 'ADMIN']).default('STAFF'),
});
router.post('/staff', validate(createStaffSchema),
  audit('staff.create', { target: (_req, body) => ({ type: 'User', id: body?.id }) }),
  async (req, res, next) => {
    try {
      const u = await prisma.user.create({
        data: {
          email: req.body.email.toLowerCase().trim(),
          passwordHash: await hashPassword(req.body.password),
          fullName: req.body.fullName,
          role: req.body.role,
          emailVerifiedAt: new Date(),
        },
      });
      res.status(201).json({ id: u.id, email: u.email, role: u.role });
    } catch (e) {
      if (e.code === 'P2002') return next(Errors.conflict('Email already registered', 'EMAIL_TAKEN'));
      next(e);
    }
  });
router.get('/staff', async (_req, res, next) => {
  try {
    res.json(await prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true, email: true, role: true, fullName: true, createdAt: true, lockedUntil: true },
      orderBy: { createdAt: 'desc' },
    }));
  } catch (e) { next(e); }
});
router.delete('/staff/:id',
  audit('staff.delete', { target: (req) => ({ type: 'User', id: req.params.id }) }),
  async (req, res, next) => {
    try {
      if (req.params.id === req.user.id) throw Errors.badRequest('Cannot delete self');
      await prisma.user.update({ where: { id: req.params.id }, data: { role: 'CUSTOMER' } });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

export default router;
