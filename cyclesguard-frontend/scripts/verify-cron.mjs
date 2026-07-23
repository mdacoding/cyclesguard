#!/usr/bin/env node
/**
 * Verifies the daily-reminders cron endpoint against a deployed base URL
 * (closes GO-LIVE B2 — Tech-owned check, run once CRON_SECRET is set).
 *
 * Usage:
 *   CRON_SECRET=*** npm run verify:cron -- https://cyclesguard.vercel.app
 *   npm run verify:cron  (falls back to .env.local + NEXT_PUBLIC_SITE_URL)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local');
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

const baseUrl = (process.argv[2] ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '')
  .replace(/\/$/, '');
const cronSecret = process.env.CRON_SECRET;

if (!baseUrl) {
  console.error('Usage: npm run verify:cron -- https://your-app.vercel.app');
  process.exit(1);
}
if (!cronSecret) {
  console.error('Missing CRON_SECRET env var — set it before running (Founder-owned secret).');
  process.exit(1);
}

const endpoints = [
  '/api/cron/daily-reminders',
  '/api/cron/session-summaries',
  '/api/cron/retention',
];

let failed = 0;

// Unauthenticated request must be rejected — proves the endpoint is not open.
try {
  const unauth = await fetch(`${baseUrl}${endpoints[0]}`);
  if (unauth.status === 401) {
    console.log('✓ Cron endpoint rejects missing Authorization (401)');
  } else {
    console.error(`✗ Cron endpoint did not reject unauthenticated request (${unauth.status})`);
    failed++;
  }
} catch (err) {
  console.error(`✗ Unauthenticated cron check failed — ${err instanceof Error ? err.message : err}`);
  failed++;
}

for (const path of endpoints) {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    if (!res.ok) {
      console.error(`✗ ${path} — HTTP ${res.status}`);
      failed++;
      continue;
    }
    const body = await res.json();
    if (typeof body?.ok === 'boolean' && body.ok) {
      console.log(`✓ ${path} — ok (${JSON.stringify(body)})`);
    } else {
      console.error(`✗ ${path} — unexpected body: ${JSON.stringify(body)}`);
      failed++;
    }
  } catch (err) {
    console.error(`✗ ${path} — ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

console.log('');
if (failed === 0) {
  console.log('Cron verification passed — see docs/pitch/PUSH-LIVE.md §3 for device test next.');
  process.exit(0);
}
console.error(`${failed} check(s) failed.`);
process.exit(1);
