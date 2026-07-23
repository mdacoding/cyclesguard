#!/usr/bin/env node
/**
 * Sync selected Go-Live secrets from .env.local → Vercel Production.
 * Never prints secret values. Skips placeholders and already-set keys unless --force.
 *
 * Usage:
 *   node scripts/sync-vercel-env.mjs
 *   node scripts/sync-vercel-env.mjs --force
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const force = process.argv.includes('--force');

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_DEMO_MODE',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'CRON_SECRET',
  'CONSENT_IP_SALT',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
];

function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.error('No .env.local found');
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
  return map;
}

function isPlaceholder(val) {
  if (!val) return true;
  const v = val.toLowerCase();
  return (
    v.includes('your-') ||
    v.includes('changeme') ||
    v.includes('fake') ||
    v === 'true' && false ||
    v.includes('example') ||
    v === 'xxx'
  );
}

function listProductionKeys() {
  const res = spawnSync('npx', ['vercel', 'env', 'ls', 'production'], {
    encoding: 'utf8',
    shell: true,
  });
  const out = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  const keys = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s+/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function upsertEnv(key, value) {
  // Remove existing so add is idempotent
  spawnSync('npx', ['vercel', 'env', 'rm', key, 'production', '-y'], {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const tmp = join(tmpdir(), `cg-env-${randomBytes(8).toString('hex')}.txt`);
  try {
    writeFileSync(tmp, value, 'utf8');
    const res = spawnSync(
      'npx',
      ['vercel', 'env', 'add', key, 'production'],
      {
        encoding: 'utf8',
        shell: true,
        input: readFileSync(tmp, 'utf8'),
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    if (res.status !== 0) {
      const err = `${res.stdout ?? ''}${res.stderr ?? ''}`;
      throw new Error(err.trim() || `exit ${res.status}`);
    }
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

const env = loadEnvLocal();
const existing = listProductionKeys();
console.log(`Vercel production currently has ${existing.size} env name(s).`);

let synced = 0;
let skipped = 0;
let missing = 0;

for (const key of KEYS) {
  const val = env[key];
  if (isPlaceholder(val)) {
    console.log(`○ ${key} — missing/placeholder in .env.local (skip)`);
    missing++;
    continue;
  }
  if (existing.has(key) && !force) {
    console.log(`· ${key} — already on Vercel production (use --force to overwrite)`);
    skipped++;
    continue;
  }
  try {
    upsertEnv(key, val);
    console.log(`✓ ${key} — synced to production (${val.length} chars)`);
    synced++;
  } catch (e) {
    console.error(`✗ ${key} — ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
}

console.log('');
console.log(`Done: ${synced} synced, ${skipped} kept, ${missing} missing locally.`);
console.log('Redeploy production after sync for Runtime to pick up new env.');
