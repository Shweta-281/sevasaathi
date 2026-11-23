import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccess, newRefreshToken, hashRefreshToken, refreshExpiry } from '../utils/jwt.js';
import { Errors } from '../lib/errors.js';
import { notify } from '../lib/sse.js';
import { sendEmail } from './email.service.js';
import { config } from '../config.js';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'node:crypto';

const isDev = config.NODE_ENV !== 'production';
let googleKeysCache = { keys: null, expiresAt: 0 };

async function getGoogleSigningKey(kid) {
  if (!googleKeysCache.keys || googleKeysCache.expiresAt <= Date.now()) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!response.ok) throw new Error('Unable to retrieve Google signing keys');
    const body = await response.json();
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
    googleKeysCache = { keys: body.keys || [], expiresAt: Date.now() + maxAge * 1000 };
  }
  const jwk = googleKeysCache.keys.find((key) => key.kid === kid && key.alg === 'RS256');
  if (!jwk) throw new Error('Unknown Google signing key');
  return createPublicKey({ key: jwk, format: 'jwk' });
}

async function verifyGoogleCredential(credential, nonce) {
  try {
    const header = jwt.decode(credential, { complete: true })?.header;
    if (!header?.kid || header.alg !== 'RS256') throw new Error('Invalid token header');
    const key = await getGoogleSigningKey(header.kid);
    const claims = jwt.verify(credential, key, {
      algorithms: ['RS256'],
      audience: config.GOOGLE_CLIENT_ID,
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      clockTolerance: 5,
    });
    if (claims.nonce !== nonce || !claims.sub || !claims.email || claims.email_verified !== true) throw new Error('Invalid Google identity claims');
    return claims;
  } catch {
    throw Errors.unauthorized('Google sign-in could not be verified. Please try again.', 'INVALID_GOOGLE_TOKEN');
  }
}

async function issueSession(user, req) {
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  notify(user.id, 'session_invalidated', { reason: 'new_login' });
  const refreshToken = newRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(),
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 250),
    },
  });
  return { accessToken: signAccess(user), refreshToken };
}

export async function register({ email, password, fullName, phone }) {
  email = email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw Errors.conflict('Email already registered', 'EMAIL_TAKEN');
  }
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), fullName, phone, role: 'CUSTOMER' },
  });
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyTokenHash: hashRefreshToken(token), emailVerifyExpiresAt: new Date(Date.now() + 24 * 3600_000) },
  });
  const link = `${config.APP_BASE_URL}/api/auth/verify-email?token=${token}`;
  await sendEmail({ to: user.email, template: 'verify-email', vars: { name: user.fullName || user.email, link } });
  if (isDev) console.log('[dev] verify:', link);
  return { id: user.id, email: user.email, role: user.role };
}

export async function getProfile(userId) {
  const [user] = await prisma.$queryRaw`SELECT "id", "email", "role", "fullName", "phone", "address" FROM "User" WHERE "id" = ${userId} LIMIT 1`;
  if (!user) throw Errors.notFound('Account not found');
  return user;
}

export async function updateProfile(userId, data) {
  await prisma.$executeRaw`UPDATE "User" SET "fullName" = ${data.fullName}, "phone" = ${data.phone || null}, "address" = ${data.address || null}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${userId}`;
  return getProfile(userId);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !await verifyPassword(currentPassword, user.passwordHash)) throw Errors.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function deleteAccount(userId, password) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !await verifyPassword(password, user.passwordHash)) throw Errors.unauthorized('Password is incorrect', 'INVALID_PASSWORD');
  const documents = await prisma.document.findMany({ where: { request: { userId } }, select: { storedName: true } });
  await prisma.user.delete({ where: { id: userId } });
  const directory = path.resolve(config.UPLOAD_DIR);
  await Promise.all(documents.map(({ storedName }) => {
    const filePath = path.resolve(directory, storedName);
    return filePath.startsWith(`${directory}${path.sep}`) ? fs.unlink(filePath).catch(() => {}) : Promise.resolve();
  }));
}

export async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyTokenHash: hashRefreshToken(token), emailVerifyExpiresAt: { gt: new Date() } },
  });
  if (!user) throw Errors.badRequest('Invalid or expired token', 'INVALID_TOKEN');
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailVerifyTokenHash: null, emailVerifyExpiresAt: null },
  });
}

export async function login({ email, password }, req) {
  email = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Errors.tooMany('Account locked. Try again later.', 'ACCOUNT_LOCKED');
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const newFailed = user.failedLoginCount + 1;
    const lockedUntil = newFailed >= config.LOCKOUT_MAX_ATTEMPTS
      ? new Date(Date.now() + config.LOCKOUT_WINDOW_MIN * 60_000)
      : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: newFailed, lockedUntil } });
    throw Errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  const session = await issueSession(user, req);
  return { ...session, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName, phone: user.phone } };
}

export async function loginWithGoogle(credential, nonce, req) {
  const claims = await verifyGoogleCredential(credential, nonce);
  const email = claims.email.toLowerCase().trim();
  const authoritativeEmail = email.endsWith('@gmail.com') || Boolean(claims.hd);
  let [user] = await prisma.$queryRaw`SELECT "id", "email", "role", "fullName", "phone" FROM "User" WHERE "googleSub" = ${claims.sub} LIMIT 1`;

  if (!user) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (!authoritativeEmail) throw Errors.conflict('This email is already registered. Sign in with your password first.', 'EMAIL_TAKEN');
      const [linked] = await prisma.$queryRaw`SELECT "googleSub" FROM "User" WHERE "id" = ${existing.id} LIMIT 1`;
      if (linked?.googleSub && linked.googleSub !== claims.sub) throw Errors.conflict('This account is linked to a different Google account.', 'GOOGLE_ACCOUNT_LINKED');
      await prisma.$executeRaw`UPDATE "User" SET "googleSub" = ${claims.sub}, "emailVerifiedAt" = COALESCE("emailVerifiedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${existing.id}`;
      user = { id: existing.id, email: existing.email, role: existing.role, fullName: existing.fullName, phone: existing.phone };
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(crypto.randomBytes(48).toString('hex')),
          fullName: typeof claims.name === 'string' ? claims.name.slice(0, 100) : null,
          role: 'CUSTOMER',
          ...(authoritativeEmail ? { emailVerifiedAt: new Date() } : {}),
        },
      });
      await prisma.$executeRaw`UPDATE "User" SET "googleSub" = ${claims.sub} WHERE "id" = ${created.id}`;
      user = { id: created.id, email: created.email, role: created.role, fullName: created.fullName, phone: created.phone };
    }
  }

  const session = await issueSession(user, req);
  return { ...session, user };
}

export async function refresh(refreshToken, req) {
  if (!refreshToken) throw Errors.unauthorized('Missing refresh token', 'NO_REFRESH');
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(refreshToken) } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw Errors.unauthorized('Invalid refresh token', 'INVALID_REFRESH');
  }
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) throw Errors.unauthorized('Invalid session', 'INVALID_SESSION');
  const newToken = newRefreshToken();
  const created = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(newToken),
      expiresAt: refreshExpiry(),
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 250),
    },
  });
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date(), replacedById: created.id } });
  return { accessToken: signAccess(user), refreshToken: newToken };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function forgotPassword(email) {
  email = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashRefreshToken(token),
      passwordResetExpiresAt: new Date(Date.now() + 3600_000),
    },
  });
  const link = `${config.APP_BASE_URL}/reset-password?token=${token}`;
  await sendEmail({ to: user.email, template: 'reset-password', vars: { name: user.fullName || user.email, link } });
  if (isDev) console.log('[dev] reset:', link);
}

export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: hashRefreshToken(token), passwordResetExpiresAt: { gt: new Date() } },
  });
  if (!user) throw Errors.badRequest('Invalid or expired token', 'INVALID_TOKEN');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  notify(user.id, 'session_invalidated', { reason: 'password_reset' });
}
