import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { addClient, removeClient } from '../lib/sse.js';
import * as auth from '../services/auth.service.js';
import { config } from '../config.js';
import { Errors } from '../lib/errors.js';
import crypto from 'node:crypto';

const router = Router();

const cookieOpts = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: config.REFRESH_TOKEN_TTL_DAYS * 86400_000,
};

const loginLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const googleNonceCookie = 'googleSignInNonce';
const googleNonceOpts = { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: 5 * 60_000 };

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8).max(128) });
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/).or(z.literal('')),
  address: z.string().trim().max(500).optional(),
});
const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) });
const deleteAccountSchema = z.object({ password: z.string().min(1), confirmation: z.literal('DELETE') });

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try { res.status(201).json(await auth.register(req.body)); } catch (e) { next(e); }
});
router.get('/me', requireAuth, async (req, res, next) => {
  try { res.json(await auth.getProfile(req.user.id)); } catch (e) { next(e); }
});
router.patch('/me', requireAuth, validate(profileSchema), async (req, res, next) => {
  try { res.json(await auth.updateProfile(req.user.id, req.body)); } catch (e) { next(e); }
});
router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try { await auth.changePassword(req.user.id, req.body); res.json({ ok: true }); } catch (e) { next(e); }
});
router.delete('/me', requireAuth, validate(deleteAccountSchema), async (req, res, next) => {
  try { await auth.deleteAccount(req.user.id, req.body.password); res.clearCookie('refreshToken', { path: '/' }); res.json({ ok: true }); } catch (e) { next(e); }
});
router.get('/verify-email', async (req, res, next) => {
  try {
    const token = String(req.query.token || '');
    if (!token) throw Errors.badRequest('Missing token');
    await auth.verifyEmail(token);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await auth.login(req.body, req);
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.json({ accessToken, user });
  } catch (e) { next(e); }
});
router.get('/google/config', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ clientId: config.GOOGLE_CLIENT_ID });
});
router.get('/google/nonce', (_req, res) => {
  if (!config.GOOGLE_CLIENT_ID) throw Errors.notFound('Google sign-in is not configured');
  const nonce = crypto.randomBytes(32).toString('base64url');
  res.cookie(googleNonceCookie, nonce, googleNonceOpts);
  res.set('Cache-Control', 'no-store');
  res.json({ nonce });
});
router.post('/google', loginLimiter, async (req, res, next) => {
  const nonce = req.cookies?.[googleNonceCookie];
  res.clearCookie(googleNonceCookie, { ...googleNonceOpts, maxAge: undefined });
  try {
    if (!config.GOOGLE_CLIENT_ID) throw Errors.notFound('Google sign-in is not configured');
    if (!nonce || typeof req.body?.credential !== 'string') throw Errors.unauthorized('Google sign-in could not be verified', 'INVALID_GOOGLE_TOKEN');
    const { accessToken, refreshToken, user } = await auth.loginWithGoogle(req.body.credential, nonce, req);
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.json({ accessToken, user });
  } catch (e) { next(e); }
});
router.post('/refresh', async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await auth.refresh(req.cookies?.refreshToken, req);
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.json({ accessToken });
  } catch (e) { next(e); }
});
router.post('/logout', async (req, res, next) => {
  try {
    await auth.logout(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
router.post('/forgot-password', validate(forgotSchema), async (req, res, next) => {
  try { await auth.forgotPassword(req.body.email); res.json({ ok: true }); } catch (e) { next(e); }
});
router.post('/reset-password', validate(resetSchema), async (req, res, next) => {
  try { await auth.resetPassword(req.body.token, req.body.password); res.json({ ok: true }); } catch (e) { next(e); }
});

router.get('/events', requireAuth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders?.();
  res.write('event: connected\ndata: {}\n\n');
  addClient(req.user.id, res);
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25_000);
  req.on('close', () => { clearInterval(hb); removeClient(req.user.id, res); });
});

export default router;
