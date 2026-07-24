#!/usr/bin/env node
/**
 * Smoke: Postgres durable rate-limit RPC (migration 018).
 *
 * Usage: npm run verify:rate-limit
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

function createServiceRoleClient(url, serviceKey) {
  const key = serviceKey.trim().replace(/^["']|["']$/g, '');
  const isOpaqueKey = key.startsWith('sb_');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: isOpaqueKey
      ? {
          fetch: (input, init) => {
            const headers = new Headers();
            new Headers(init?.headers).forEach((value, name) => {
              if (name.toLowerCase() === 'authorization') return;
              headers.set(name, value);
            });
            headers.set('apikey', key);
            return fetch(input, { ...init, headers });
          },
        }
      : undefined,
  });
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SERVICE_ROLE / SECRET key');
  process.exit(1);
}

const admin = createServiceRoleClient(url, serviceKey);
const probeKey = `verify-rate-limit:${Date.now()}`;

const { data, error } = await admin.rpc('consume_rate_limit', {
  p_key: probeKey,
  p_limit: 2,
  p_window_ms: 60_000,
});

if (error) {
  console.error('✗ consume_rate_limit RPC failed:', error.message);
  console.error('  → Apply migration 018_api_rate_limits.sql');
  process.exit(1);
}

const row = Array.isArray(data) ? data[0] : data;
if (!row?.ok) {
  console.error('✗ unexpected RPC payload', data);
  process.exit(1);
}

const second = await admin.rpc('consume_rate_limit', {
  p_key: probeKey,
  p_limit: 1,
  p_window_ms: 60_000,
});
const row2 = Array.isArray(second.data) ? second.data[0] : second.data;
if (second.error) {
  console.error('✗ second consume failed:', second.error.message);
  process.exit(1);
}
if (row2?.ok !== false) {
  console.error('✗ expected block on second hit with limit=1', row2);
  process.exit(1);
}

console.log('✓ consume_rate_limit allows then blocks (migration 018 live)');
process.exit(0);
