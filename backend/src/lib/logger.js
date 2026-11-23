import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    censor: '[REDACTED]',
    paths: [
      'req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
      'req.body.password', 'req.body.aadhaar', 'req.body.aadhaarNumber', 'req.body.token',
      '*.password', '*.passwordHash', '*.aadhaar', '*.aadhaarNumber',
      '*.refreshToken', '*.accessToken', '*.aadhaarEncrypted',
    ],
  },
});