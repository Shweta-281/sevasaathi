import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { Errors } from '../lib/errors.js';

const uploadDir = path.resolve(config.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAGIC = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: config.MAX_UPLOAD_BYTES, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(Errors.badRequest('Unsupported file type', 'UNSUPPORTED_FILE'));
    cb(null, true);
  },
});

export function verifyMagic(file, expectedMime) {
  const sigs = MAGIC[expectedMime];
  if (!sigs) return false;
  const fd = fs.openSync(file.path, 'r');
  const buf = Buffer.alloc(8);
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);
  return sigs.some((sig) => sig.every((b, i) => buf[i] === b));
}