import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const url = process.env.DATABASE_URL || '';
const m = url.match(/^file:(.*?)(\?|$)/);
if (!m) { console.error('DATABASE_URL must be a file: URL'); process.exit(1); }
const dbPath = path.resolve(m[1].trim());
const backupDir = path.resolve(process.env.BACKUP_DIR || './storage/backups');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(backupDir, `sevasaathi-${stamp}.db`);
try {
  execSync(`sqlite3 "${dbPath}" ".backup '${out}'"`, { stdio: 'inherit' });
} catch {
  fs.copyFileSync(dbPath, out);
}
console.log('Backup written:', out);
