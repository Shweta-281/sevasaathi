import crypto from 'node:crypto';
import { config } from '../config.js';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const encodeBase32 = (buffer) => {
  let bits = 0; let value = 0; let output = '';
  for (const byte of buffer) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
};
const decodeBase32 = (text) => {
  let bits = 0; let value = 0; const output = [];
  for (const char of text.toUpperCase().replace(/=+$/g, '')) { const index = alphabet.indexOf(char); if (index < 0) throw new Error('Invalid base32 secret'); value = (value << 5) | index; bits += 5; if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(output);
};
const encryptionKey = () => crypto.createHash('sha256').update(`${config.TOTP_ENC_KEY || config.JWT_ACCESS_SECRET}:sevasaathi-totp`).digest();

export function newTotpSecret() { return encodeBase32(crypto.randomBytes(20)); }
export function encryptTotpSecret(secret) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('hex')).join('.');
}
export function decryptTotpSecret(value) {
  const [ivHex, tagHex, dataHex] = value.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}
export function verifyTotp(secret, code, now = Date.now()) {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  const key = decodeBase32(secret); const supplied = Buffer.from(String(code));
  for (let delta = -1; delta <= 1; delta++) {
    const counter = Math.floor(now / 30000) + delta;
    const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
    const expected = Buffer.from(String(binary % 1_000_000).padStart(6, '0'));
    if (crypto.timingSafeEqual(supplied, expected)) return true;
  }
  return false;
}
