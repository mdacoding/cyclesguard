#!/usr/bin/env node
/**
 * Prints a Vercel env checklist from local .env.local (names only for secrets).
 * Usage: node scripts/print-vercel-env-checklist.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_DEMO_MODE',
  'CRON_SECRET',
  'CONSENT_IP_SALT',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
];

const optional = [
  'INGESTION_BASE_URL',
  'INGESTION_MANAGEMENT_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_IMPRESSUM_NAME',
  'NEXT_PUBLIC_IMPRESSUM_STREET',
  'NEXT_PUBLIC_IMPRESSUM_CITY',
  'SUPABASE_SECRET_KEY',
];

const envPath = join(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('No .env.local — run npm run pitch:setup-env first');
  process.exit(1);
}

const map = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  map[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

function isPlaceholder(val) {
  return !val || val.includes('your-') || val.includes('changeme') || val.includes('Fake');
}

function showValue(key, val) {
  if (key.startsWith('NEXT_PUBLIC_') && !key.includes('KEY') && !key.includes('DSN')) {
    return val;
  }
  if (key === 'NEXT_PUBLIC_DEMO_MODE' || key === 'NEXT_PUBLIC_SUPABASE_URL') {
    return val;
  }
  return `(set — ${val.length} chars, value hidden)`;
}

console.log('Copy these into Vercel → Project → Settings → Environment Variables\n');
console.log('Root Directory must be: cyclesguard-frontend\n');
console.log('=== Required (Pitch + Soft-Pilot) ===\n');

let missing = 0;
for (const key of required) {
  const val = map[key];
  if (isPlaceholder(val)) {
    console.log(`✗ ${key}  MISSING or placeholder`);
    missing += 1;
    continue;
  }
  console.log(`✓ ${key}=${showValue(key, val)}`);
}

console.log('\n=== Optional (GPS / monitoring / Impressum) ===\n');
for (const key of optional) {
  const val = map[key];
  if (isPlaceholder(val)) {
    console.log(`○ ${key}  not set`);
    continue;
  }
  console.log(`✓ ${key}=${showValue(key, val)}`);
}

console.log('\n=== Mode hints ===');
console.log('  Pitch demo:     NEXT_PUBLIC_DEMO_MODE=true');
console.log('  Soft-Pilot:     NEXT_PUBLIC_DEMO_MODE=false  (Prod aktuell)');
console.log('  Site URL prod:  NEXT_PUBLIC_SITE_URL=https://cyclesguard.vercel.app');
console.log('  Impressum:      NEXT_PUBLIC_IMPRESSUM_STREET + _CITY für §5 TMG');

console.log('\nAfter deploy:');
console.log('  1. Supabase Auth Site URL + Redirect …/auth/callback (+ set-password / **)');
console.log('  2. npm run verify:go-live -- https://cyclesguard.vercel.app');
console.log('  3. Push: docs/pitch/PUSH-LIVE.md');
console.log('  4. Pilot: docs/pitch/PILOT-RUNBOOK.md');
console.log('  5. Spielerinnen-Vorlage: /spielerinnen-info');

if (missing > 0) {
  console.log(`\n${missing} required variable(s) missing.`);
  process.exit(1);
}
