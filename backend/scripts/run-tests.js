import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// Tests always use a fresh database under the OS temp directory. The project .env
// database is never passed to Prisma CLI or the test workers.
const dbFile = `sevasaathi-test-run-${randomUUID()}.db`;
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: `file:./${dbFile}`,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'test-only-jwt-secret-at-least-32-chars',
  AADHAAR_ENC_KEY: process.env.AADHAAR_ENC_KEY || '0'.repeat(64),
};
const run = (script, args) => spawnSync(process.execPath, [script, ...args], {
  cwd: process.cwd(), env, stdio: 'inherit',
});

try {
  const schema = run('node_modules/prisma/build/index.js', ['db', 'push', '--skip-generate']);
  if (schema.status !== 0) process.exitCode = schema.status || 1;
  else {
    const tests = run('node_modules/vitest/vitest.mjs', ['run', '--maxWorkers=1', '--no-file-parallelism']);
    process.exitCode = tests.status || 0;
  }
} finally {
  for (const suffix of ['', '-wal', '-shm']) rmSync(path.resolve(dbFile + suffix), { force: true });
}
