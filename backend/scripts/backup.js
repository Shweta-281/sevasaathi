import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL || '';
const backupDir = path.resolve(process.env.BACKUP_DIR || './storage/backups');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

if (/^postgres(?:ql)?:\/\//i.test(url)) {
  const db = new URL(url);
  const out = path.join(backupDir, `sevasaathi-${stamp}.dump`);
  const env = {
    ...process.env,
    PGHOST: db.hostname,
    PGPORT: db.port || '5432',
    PGUSER: decodeURIComponent(db.username),
    PGPASSWORD: decodeURIComponent(db.password),
    PGDATABASE: db.pathname.replace(/^\//, ''),
  };
  const result = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', out], { env, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error('PostgreSQL backup failed. Install pg_dump and confirm database access.');
  }
  console.log('PostgreSQL backup written:', out);
} else {
  const match = url.match(/^file:(.*?)(?:\?|$)/);
  if (!match) throw new Error('DATABASE_URL must use SQLite file: or PostgreSQL postgresql:// syntax');
  const dbPath = path.resolve(match[1].replace(/^\.\//, ''));
  const out = path.join(backupDir, `sevasaathi-${stamp}.db`);
  const dotCommand = `.backup '${out.replaceAll("'", "''")}'`;
  const result = spawnSync('sqlite3', [dbPath, dotCommand], { stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error('SQLite online backup failed. Install sqlite3 CLI; direct file copy is intentionally avoided because WAL may be active.');
  }
  console.log('SQLite backup written:', out);
}
