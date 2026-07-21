#!/usr/bin/env node
/**
 * Smoke-checks a deployed pitch demo (P0.1 verification).
 *
 * Usage:
 *   npm run pitch:smoke -- https://your-app.vercel.app
 *   SITE_URL=https://... npm run pitch:smoke
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

if (!baseUrl) {
  console.error('Usage: npm run pitch:smoke -- https://your-app.vercel.app');
  process.exit(1);
}

const checks = [
  { name: 'Home', path: '/', expect: 200 },
  { name: 'Login', path: '/login', expect: 200 },
  { name: 'Trainer dashboard (auth redirect ok)', path: '/trainer/dashboard', expect: [200, 307, 308] },
  { name: 'Offline page', path: '/~offline', expect: 200 },
  { name: 'Manifest', path: '/manifest.json', expect: 200 },
];

let failed = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const allowed = Array.isArray(check.expect) ? check.expect : [check.expect];
    if (allowed.includes(res.status)) {
      console.log(`✓ ${check.name} (${res.status})`);
    } else {
      console.error(`✗ ${check.name} — expected ${allowed.join('|')}, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`✗ ${check.name} — ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('your-project')) {
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
    });
    if (res.status === 200 || res.status === 401) {
      console.log('✓ Supabase REST reachable');
    } else {
      console.error(`✗ Supabase REST — status ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`✗ Supabase REST — ${err instanceof Error ? err.message : err}`);
    failed++;
  }
} else {
  console.log('○ Supabase check skipped (keys not in .env.local)');
}

console.log('');
if (failed === 0) {
  console.log('Smoke test passed. Run manual login test with docs/pitch/DEMO-ACCOUNTS.md');
  process.exit(0);
}

console.error(`${failed} check(s) failed.`);
process.exit(1);
