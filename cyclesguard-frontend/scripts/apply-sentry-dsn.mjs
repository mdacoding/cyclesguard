#!/usr/bin/env node
/**
 * Apply Sentry DSN to Vercel Production (both public + server vars).
 * Never prints the DSN.
 *
 * Usage:
 *   $env:SENTRY_DSN="https://....@....ingest.de.sentry.io/...."
 *   node scripts/apply-sentry-dsn.mjs
 *   # then: npx vercel --prod --yes   (from monorepo root)
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const setEnv = join(root, 'set-vercel-env.mjs');

const dsn = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || process.argv[2] || '').trim();
if (!dsn) {
  console.error('Missing DSN. Set $env:SENTRY_DSN or pass as argv[2].');
  process.exit(1);
}
if (!/^https:\/\/.+@.+\.ingest(\.[a-z]+)?\.sentry\.io\/\d+/.test(dsn) && !dsn.includes('ingest.sentry.io') && !dsn.includes('ingest.de.sentry.io')) {
  console.error('DSN does not look like a Sentry ingest URL.');
  process.exit(1);
}

for (const key of ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN']) {
  const res = spawnSync(process.execPath, [setEnv, key, dsn], {
    encoding: 'utf8',
    cwd: join(root, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.status !== 0) {
    console.error(`Failed ${key}: ${(res.stderr || res.stdout || '').trim()}`);
    process.exit(1);
  }
  console.log((res.stdout || '').trim() || `✓ ${key}`);
}

console.log('Next: from monorepo root → npx vercel --prod --yes');
console.log('Then Admin → Compliance → Ops-Status should show sentry:ok');
