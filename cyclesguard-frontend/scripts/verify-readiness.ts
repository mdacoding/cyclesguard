/**
 * Production Readiness & Security Verification (Phase-B Polish).
 *
 * Runs three checks against the configured Supabase project:
 *   1. Env Check      — required server/public env vars are present.
 *   2. RLS Check      — every sensitive public table has Row Level Security
 *                       enabled (via the service-role-only admin_rls_status() RPC,
 *                       see supabase/migrations/019_admin_ops_polish.sql).
 *   3. Zero-Knowledge  — signs in as a trainer and proves the trainer session
 *      Audit Test        cannot read a *known-to-exist* cycle_logs row (symptom/
 *                       phase/notes stay unreadable even by primary key filter).
 *
 * Zero paid dependencies — reuses @supabase/supabase-js (already a project
 * dependency) and tsx (already a devDependency). No network calls beyond the
 * project's own Supabase instance.
 *
 * Usage:
 *   npm run verify:prod
 *
 * Env (loaded from .env.local if present, same convention as other verify:* scripts):
 *   NEXT_PUBLIC_SUPABASE_URL          required
 *   SUPABASE_SERVICE_ROLE_KEY /
 *   SUPABASE_SECRET_KEY               required (one of)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY     required for the Zero-Knowledge check
 *   NEXT_PUBLIC_IMPRESSUM_NAME        recommended (Impressum §5 TMG)
 *   NEXT_PUBLIC_IMPRESSUM_STREET /
 *   NEXT_PUBLIC_IMPRESSUM_CITY        recommended (page has a safe fallback if unset)
 *   E2E_TRAINER_EMAIL / _PASSWORD     optional — enables the Zero-Knowledge check
 *   DEMO_ALLOW=1                      optional — falls back to seed:demo trainer creds
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '../lib/supabase/service-client';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

let hardFailures = 0;
let warnings = 0;

function pass(msg: string) {
  console.log(`${GREEN}✓${RESET} ${msg}`);
}
function fail(msg: string) {
  console.error(`${RED}✗${RESET} ${msg}`);
  hardFailures += 1;
}
function warn(msg: string) {
  console.warn(`${YELLOW}○${RESET} ${msg}`);
  warnings += 1;
}
function section(title: string) {
  console.log(`\n${BOLD}── ${title} ──${RESET}`);
}

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

async function main() {
loadEnvLocal();

// ── 1. Env Check ────────────────────────────────────────────────────────────
section('1/3 Env Check');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl) pass('NEXT_PUBLIC_SUPABASE_URL set');
else fail('NEXT_PUBLIC_SUPABASE_URL missing');

if (serviceKey) pass('SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY set');
else fail('SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY missing');

if (anonKey) pass('NEXT_PUBLIC_SUPABASE_ANON_KEY set');
else warn('NEXT_PUBLIC_SUPABASE_ANON_KEY missing — Zero-Knowledge check will be skipped');

if (process.env.NEXT_PUBLIC_IMPRESSUM_NAME) {
  pass('NEXT_PUBLIC_IMPRESSUM_NAME set');
} else {
  warn('NEXT_PUBLIC_IMPRESSUM_NAME unset — /impressum falls back to the default operator name');
}
if (process.env.NEXT_PUBLIC_IMPRESSUM_STREET && process.env.NEXT_PUBLIC_IMPRESSUM_CITY) {
  pass('NEXT_PUBLIC_IMPRESSUM_STREET / _CITY set');
} else {
  warn(
    '/impressum has no postal address configured — it falls back to "Postanschrift auf Anfrage". ' +
      'Set NEXT_PUBLIC_IMPRESSUM_STREET + NEXT_PUBLIC_IMPRESSUM_CITY before scaling paid clubs.'
  );
}

if (!supabaseUrl || !serviceKey) {
  console.error('\nCannot continue without Supabase URL + service key.');
  process.exitCode = 1;
  return;
}

const admin = createServiceRoleClient(supabaseUrl, serviceKey);

// ── 2. RLS Check ─────────────────────────────────────────────────────────────
section('2/3 RLS Check');

const REQUIRED_RLS_TABLES = [
  'cycle_logs',
  'player_consents',
  'session_summaries',
  'teams',
  'team_members',
  'clubs',
  'club_members',
  'admin_audit_log',
  'seasons',
  'athlete_links',
  'pilot_feedback',
  'api_rate_limits',
];

const { data: rlsRows, error: rlsError } = await admin.rpc('admin_rls_status');

if (rlsError) {
  fail(
    `admin_rls_status() RPC failed: ${rlsError.message} — apply supabase/migrations/019_admin_ops_polish.sql`
  );
} else {
  const byName = new Map(
    ((rlsRows ?? []) as { table_name: string; rls_enabled: boolean; policy_count: number }[]).map(
      (r) => [r.table_name, r]
    )
  );
  for (const table of REQUIRED_RLS_TABLES) {
    const row = byName.get(table);
    if (!row) {
      warn(`${table}: not found in schema (skipped)`);
      continue;
    }
    if (row.rls_enabled && row.policy_count > 0) {
      pass(`${table}: RLS enabled (${row.policy_count} polic${row.policy_count === 1 ? 'y' : 'ies'})`);
    } else if (row.rls_enabled) {
      warn(`${table}: RLS enabled but zero policies — table is effectively locked to service_role only`);
    } else {
      fail(`${table}: RLS is DISABLED — sensitive table is unprotected`);
    }
  }
}

// ── 3. Zero-Knowledge Audit Test ────────────────────────────────────────────
section('3/3 Zero-Knowledge Audit Test');

const trainerEmail =
  process.env.E2E_TRAINER_EMAIL ??
  (process.env.DEMO_ALLOW === '1' ? 'trainer@eintracht-demo.de' : undefined);
const trainerPassword =
  process.env.E2E_TRAINER_PASSWORD ?? (process.env.DEMO_ALLOW === '1' ? 'CyclesGuard2026!' : undefined);

if (!anonKey) {
  warn('Skipped — no NEXT_PUBLIC_SUPABASE_ANON_KEY');
} else if (!trainerEmail || !trainerPassword) {
  warn('Skipped — set E2E_TRAINER_EMAIL/PASSWORD or DEMO_ALLOW=1 (needs npm run seed:demo)');
} else {
  const { data: sampleRow, error: sampleError } = await admin
    .from('cycle_logs')
    .select('id, user_id, phase, symptoms, notes, energy_level')
    .limit(1)
    .maybeSingle();

  if (sampleError) {
    warn(`Could not read a sample cycle_logs row via service role: ${sampleError.message}`);
  } else if (!sampleRow) {
    warn('No cycle_logs rows exist yet — run npm run seed:demo to enable this proof');
  } else {
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: trainerSession, error: signInError } = await anon.auth.signInWithPassword({
      email: trainerEmail,
      password: trainerPassword,
    });

    if (signInError || !trainerSession.session) {
      warn(`Trainer sign-in failed: ${signInError?.message ?? 'no session'} — check demo seed`);
    } else {
      pass(`Trainer signed in (${trainerEmail})`);

      const { data: leaked, error: queryError } = await anon
        .from('cycle_logs')
        .select('id, phase, symptoms, notes, energy_level')
        .eq('user_id', sampleRow.user_id);

      if (queryError) {
        pass(`Trainer direct query to cycle_logs errored as expected: ${queryError.message}`);
      } else if (!leaked || leaked.length === 0) {
        pass(
          'Trainer session cannot read a known-to-exist cycle_logs row (RLS blocks phase/symptoms/notes)'
        );
      } else {
        fail(
          `CRITICAL: Trainer session read ${leaked.length} raw cycle_logs row(s), including phase/symptoms — RLS is broken`
        );
      }

      await anon.auth.signOut();
    }
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
if (hardFailures > 0) {
  console.error(`${BOLD}${RED}Readiness FAILED — ${hardFailures} hard failure(s), ${warnings} warning(s).${RESET}`);
  process.exitCode = 1;
  return;
}
console.log(`${BOLD}${GREEN}Readiness OK${RESET} — 0 hard failures, ${warnings} warning(s).`);
}

main().catch((err) => {
  console.error(`${RED}Readiness script crashed:${RESET}`, err);
  process.exitCode = 1;
});
