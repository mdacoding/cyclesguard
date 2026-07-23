#!/usr/bin/env node
/**
 * Set a single Vercel Production env var without printing the value.
 *
 * Usage:
 *   node scripts/set-vercel-env.mjs NEXT_PUBLIC_DEMO_MODE false
 *   SENTRY_DSN=https://...@....ingest.sentry.io/... node scripts/set-vercel-env.mjs NEXT_PUBLIC_SENTRY_DSN
 */
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const key = process.argv[2];
let value = process.argv[3];

if (!key) {
  console.error('Usage: node scripts/set-vercel-env.mjs KEY [value]');
  process.exit(1);
}

if (value === undefined) {
  value = process.env[key] || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';
  if (!value && !process.stdin.isTTY) {
    value = readFileSync(0, 'utf8').trim();
  }
}

if (!value) {
  console.error(`No value for ${key}. Pass as arg or set env.`);
  process.exit(1);
}

spawnSync('npx', ['vercel', 'env', 'rm', key, 'production', '-y'], {
  encoding: 'utf8',
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

const tmp = join(tmpdir(), `cg-env-${randomBytes(6).toString('hex')}.txt`);
try {
  writeFileSync(tmp, value, 'utf8');
  const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'production'], {
    encoding: 'utf8',
    shell: true,
    input: `${value}\n`,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (res.status !== 0) {
    console.error(`Failed to set ${key}: ${(res.stderr || res.stdout || '').trim()}`);
    process.exit(1);
  }
  console.log(`✓ ${key} set on production (${value.length} chars)`);
} finally {
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}
