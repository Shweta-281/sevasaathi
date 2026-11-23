import crypto from 'node:crypto';
import { config } from '../config.js';

const KEY = Buffer.from(config.AADHAAR_ENC_KEY, 'hex');

export function encryptAadhaar(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptAadhaar(payload) {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

export function maskAadhaar(plain) {
  const s = String(plain).replace(/\D+/g, '');
  if (s.length < 4) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${s.slice(-4)}`;
}