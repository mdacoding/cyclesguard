#!/usr/bin/env node
/**
 * Soft-Pilot trust suite against production (local substitute while GH Actions minutes are exhausted).
 *
 * Usage:
 *   npm run verify:go-live -- https://cyclesguard.vercel.app
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = (process.argv[2] ?? 'https://cyclesguard.vercel.app').replace(/\/$/, '');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();
process.env.DEMO_ALLOW = process.env.DEMO_ALLOW || '1';

const steps = [
  ['unit', ['npm', ['test']]],
  ['rls-trainer', ['npm', ['run', 'verify:rls-trainer']]],
  ['rls-privacy', ['npm', ['run', 'verify:rls-privacy', '--', baseUrl]]],
  ['invite-flow', ['npm', ['run', 'verify:invite-flow', '--', baseUrl]]],
  ['rate-limit', ['npm', ['run', 'verify:rate-limit']]],
  ['sentry', ['npm', ['run', 'verify:sentry']]],
  ['cron', ['npm', ['run', 'verify:cron', '--', baseUrl]]],
  ['admin-dryrun', ['npm', ['run', 'verify:admin-dryrun', '--', baseUrl]]],
  ['push-live', ['npm', ['run', 'verify:push-live', '--', baseUrl]]],
];

let failed = 0;
for (const [name, [cmd, args]] of steps) {
  console.log(`\n── ${name} ──`);
  const res = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
    stdio: 'inherit',
  });
  if (res.status !== 0) {
    console.error(`✗ ${name} failed`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

if (failed) {
  console.error(`\nGo-Live suite: ${failed} step(s) failed.`);
  process.exit(1);
}
console.log('\nGo-Live suite passed against', baseUrl);
