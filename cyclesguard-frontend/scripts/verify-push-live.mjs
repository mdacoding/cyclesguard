#!/usr/bin/env node
/**
 * GO-LIVE B3 automated slice: coach-safe payload + live cron smoke.
 * Physical PWA Homescreen check remains a short Founder device pass.
 *
 * Usage:
 *   npm run verify:push-live -- https://cyclesguard.vercel.app
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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

const baseUrl = (process.argv[2] ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyclesguard.vercel.app')
  .replace(/\/$/, '');

let failed = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

const unit = spawnSync('npx', ['tsx', '--test', 'lib/push/payload.test.ts'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (unit.status === 0) ok('payload unit tests (coach-safe + weekend skip)');
else fail(`payload unit tests\n${unit.stderr || unit.stdout}`);

const cron = spawnSync('npm', ['run', 'verify:cron', '--', baseUrl], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
  env: process.env,
});
if (cron.status === 0) ok(`cron smoke against ${baseUrl}`);
else fail(`cron smoke\n${cron.stderr || cron.stdout}`);

const swPath = join(root, 'app/sw.ts');
const swSrc = readFileSync(swPath, 'utf8');
if (swSrc.includes("from '../lib/push/payload'")) {
  ok('service worker uses shared coach-safe payload module');
} else {
  fail('service worker must import lib/push/payload');
}

if (failed) {
  console.error(`\n${failed} push-live check(s) failed.`);
  process.exit(1);
}
console.log('\nPush-live automated checks passed — do one Homescreen device glance when possible.');
