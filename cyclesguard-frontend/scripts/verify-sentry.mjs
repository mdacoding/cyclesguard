#!/usr/bin/env node
/**
 * Sentry readiness check (free): DSN present + strip unit + optional live event.
 *
 * Usage:
 *   npm run verify:sentry
 *   VERIFY_SENTRY_SEND=1 npm run verify:sentry   # sends one test event (uses free quota)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

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

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
let failed = 0;

if (!dsn || dsn.includes('your-') || dsn.length < 20) {
  console.warn('○ SENTRY_DSN not in local env (Prod has DSN per GO-LIVE A1)');
  if (process.env.VERIFY_SENTRY_REQUIRE_DSN === '1') {
    console.error('✗ VERIFY_SENTRY_REQUIRE_DSN=1 — DSN required');
    failed += 1;
  }
} else {
  console.log(`✓ DSN present (${dsn.length} chars, value hidden)`);
}

const unit = spawnSync(
  'npx',
  ['tsx', '--test', 'lib/sentry-strip.test.ts'],
  { encoding: 'utf8', shell: true, cwd: process.cwd() }
);
if (unit.status !== 0) {
  console.error('✗ sentry-strip unit tests failed');
  console.error(unit.stdout || unit.stderr);
  failed += 1;
} else {
  console.log('✓ sentry-strip unit tests');
}

if (process.env.VERIFY_SENTRY_SEND === '1' && dsn && !failed) {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\//, '');
    const ingestHost = u.host;
    const storeUrl = `https://${ingestHost}/api/${projectId}/store/`;
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      level: 'info',
      message: 'cyclesguard-sentry-smoke',
      tags: { smoke: 'verify:sentry' },
      extra: { note: 'no health fields' },
    };
    const res = await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=cyclesguard-verify/1.0`,
      },
      body: JSON.stringify(event),
    });
    if (res.ok || res.status === 200) {
      console.log('✓ test event accepted by Sentry ingest');
    } else {
      console.error(`✗ Sentry ingest → ${res.status}`);
      failed += 1;
    }
  } catch (err) {
    console.error('✗ Sentry send failed:', err instanceof Error ? err.message : err);
    failed += 1;
  }
} else {
  console.log('○ Live send skipped (set VERIFY_SENTRY_SEND=1 to post one smoke event)');
}

console.log('');
if (failed) {
  console.error(`Sentry verify: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log('Sentry verify OK.');
process.exit(0);
