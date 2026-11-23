import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export default async function () {
  for (const f of ['test.db', 'test.db-wal', 'test.db-shm']) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  execSync('npx prisma db push --skip-generate --force-reset', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
}