#!/usr/bin/env node
/**
 * Automated RLS trainer-JWT dry-run (closes GO-LIVE A2/A3 — Tech-owned, no
 * Founder secrets required beyond the public anon key + a trainer login).
 *
 * Signs in as a real trainer (Supabase Auth, anon key) and queries sensitive
 * tables directly via PostgREST under that trainer's JWT — exercising RLS
 * exactly as a compromised/curious trainer session would. Expects zero rows
 * (or a denial) on Art.-9 tables, and a non-empty roster as a positive control.
 *
 * Usage:
 *   npm run verify:rls-trainer
 *   npm run verify:rls-trainer -- --email trainer@x.de --password ***
 *
 * Env (falls back to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   E2E_TRAINER_EMAIL / E2E_TRAINER_PASSWORD (or RLS_TRAINER_EMAIL/PASSWORD)
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

loadEnvLocal();

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email =
  argValue('--email') ?? process.env.RLS_TRAINER_EMAIL ?? process.env.E2E_TRAINER_EMAIL;
const password =
  argValue('--password') ?? process.env.RLS_TRAINER_PASSWORD ?? process.env.E2E_TRAINER_PASSWORD;

if (!supabaseUrl || !anonKey || supabaseUrl.includes('your-project')) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}
if (!email || !password) {
  console.error(
    'Missing trainer credentials. Set E2E_TRAINER_EMAIL/PASSWORD (or RLS_TRAINER_*) or pass --email/--password.'
  );
  console.error('Demo fallback: docs/pitch/DEMO-ACCOUNTS.md');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Art.-9 / sensitive tables — a trainer session must never see rows. */
const DENY_TABLES = ['cycle_logs', 'player_consents', 'push_subscriptions', 'session_summaries'];

let failed = 0;

const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (signInError || !signIn.session) {
  console.error(`✗ Trainer sign-in failed — ${signInError?.message ?? 'no session'}`);
  process.exit(1);
}
console.log(`✓ Signed in as trainer (${email})`);

for (const table of DENY_TABLES) {
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: false });

  if (error) {
    // RLS denial surfaces as an error on some policies — treat as pass.
    console.log(`✓ ${table} — denied/error as expected (${error.message})`);
    continue;
  }
  const rows = data?.length ?? count ?? 0;
  if (rows === 0) {
    console.log(`✓ ${table} — 0 rows visible`);
  } else {
    console.error(`✗ ${table} — ${rows} row(s) visible to trainer JWT! Art.-9 LEAK.`);
    failed++;
  }
}

// Positive control: trainer must still see their own team roster.
const { data: roster, error: rosterError } = await supabase
  .from('team_members')
  .select('team_id, user_id, role');

if (rosterError) {
  console.error(`✗ team_members — unexpected error: ${rosterError.message}`);
  if (/infinite recursion/i.test(rosterError.message)) {
    console.error('  → RLS self-reference bug — see migration 015_fix_team_members_rls_recursion.sql');
  }
  failed++;
} else if (!roster || roster.length === 0) {
  console.warn('○ team_members — 0 rows (ok only if this trainer has no active team)');
} else {
  console.log(`✓ team_members — ${roster.length} row(s) visible (roster ok)`);
}

await supabase.auth.signOut();

console.log('');
if (failed === 0) {
  console.log('RLS trainer dry-run passed — no Art.-9 raw data visible to trainer JWT.');
  process.exit(0);
}
console.error(`${failed} table(s) leaked data to a trainer session.`);
process.exit(1);
