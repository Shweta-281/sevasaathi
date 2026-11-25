import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  TOTP_ENC_KEY: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  AADHAAR_ENC_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex chars'),
  CONSENT_VERSION: z.string().default('v1'),
  UPLOAD_DIR: z.string().default('./storage/uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(5 * 1024 * 1024),
  
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  
  // --- UPDATED EMAIL CONFIGURATION ---
  RESEND_API_KEY: z.string().optional().default(''),
  MAIL_FROM: z.string().default('SevaSaathi <onboarding@resend.dev>'), 
  
  SUPPORT_EMAIL: z.string().email().or(z.literal('')).default(''),
  APP_BASE_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOCKOUT_MAX_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_WINDOW_MIN: z.coerce.number().default(15),
  RETENTION_DAYS: z.coerce.number().default(365),
  BACKUP_DIR: z.string().default('./storage/backups'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid env config', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = parsed.data;