import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.js';

export const signAccess = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL,
  });

export const verifyAccess = (token) => jwt.verify(token, config.JWT_ACCESS_SECRET);

export const newRefreshToken = () => crypto.randomBytes(48).toString('hex');
export const hashRefreshToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
export const refreshExpiry = () =>
  new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 86400_000);