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

console.log('Copy these into Vercel → Project → Settings → Environment Variables\n');
console.log('Root Directory must be: cyclesguard-frontend\n');

for (const key of required) {
  const val = map[key];
  if (!val || val.includes('your-') || val.includes('changeme')) {
    console.log(`✗ ${key}  MISSING or placeholder`);
    continue;
  }
  const show =
    key.startsWith('NEXT_PUBLIC_') && !key.includes('KEY')
      ? val
      : key === 'NEXT_PUBLIC_DEMO_MODE'
        ? val
        : key === 'NEXT_PUBLIC_SUPABASE_URL'
          ? val
          : `(set — ${val.length} chars, value hidden)`;
  console.log(`✓ ${key}=${show}`);
}

console.log('\nAfter deploy:');
console.log('  1. Set NEXT_PUBLIC_SITE_URL to https://<your-deployment>.vercel.app');
console.log('  2. Supabase Auth Site URL + Redirect …/auth/callback');
console.log('  3. npm run pitch:smoke -- https://<your-deployment>.vercel.app');
