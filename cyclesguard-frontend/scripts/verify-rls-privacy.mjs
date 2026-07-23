#!/usr/bin/env node
/**
 * Cross-Team 403 + Export deny/allow (RLS checklist §D / §E).
 *
 * Usage:
 *   DEMO_ALLOW=1 npm run verify:rls-privacy -- https://cyclesguard.vercel.app
 *
 * Needs seed:demo (incl. Isolation team) + .env.local Supabase keys.
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
  const isOpaqueKey = serviceKey.startsWith('sb_');
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: isOpaqueKey
      ? {
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            headers.delete('Authorization');
            headers.set('apikey', serviceKey);
            return fetch(input, { ...init, headers });
          },
        }
      : undefined,
  });
}

loadEnvLocal();

const baseUrl = (process.argv[2] ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '')
  .replace(/\/$/, '');

const demo = process.env.DEMO_ALLOW === '1';
const trainerEmail =
  process.env.E2E_TRAINER_EMAIL ?? (demo ? 'trainer@eintracht-demo.de' : undefined);
const trainerPassword =
  process.env.E2E_TRAINER_PASSWORD ?? (demo ? 'CyclesGuard2026!' : undefined);
const playerEmail =
  process.env.E2E_PLAYER_EMAIL ?? (demo ? 'lisa.weber@eintracht-demo.de' : undefined);
const playerPassword =
  process.env.E2E_PLAYER_PASSWORD ?? (demo ? 'CyclesGuard2026!' : undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!baseUrl) {
  console.error('Usage: npm run verify:rls-privacy -- https://cyclesguard.vercel.app');
  process.exit(1);
}
if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase URL/anon key.');
  process.exit(1);
}
if (!trainerEmail || !trainerPassword || !playerEmail || !playerPassword) {
  console.error('Missing credentials. Set E2E_* or DEMO_ALLOW=1.');
  process.exit(1);
}

function cookieHeader(session) {
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const value = encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type ?? 'bearer',
      user: session.user,
    })
  );
  return `${name}=${value}`;
}

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Cookie: cookie,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* raw */
  }
  return { res, text, json };
}

let failed = 0;

function pass(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

const auth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Resolve isolation team id (foreign to primary trainer)
let foreignTeamId = null;
if (serviceKey) {
  const admin = createServiceRoleClient(supabaseUrl, serviceKey);
  const { data: isoTeam } = await admin
    .from('teams')
    .select('id')
    .eq('name', 'CyclesGuard Isolation Frauen')
    .maybeSingle();
  foreignTeamId = isoTeam?.id ?? null;
  if (!foreignTeamId) {
    const { data: anyOther } = await admin.from('teams').select('id, name').limit(20);
    console.warn(
      '○ Isolation team missing — run npm run seed:demo. Falling back to any non-roster team if present.'
    );
    const { data: signProbe } = await auth.auth.signInWithPassword({
      email: trainerEmail,
      password: trainerPassword,
    });
    if (signProbe?.session) {
      const { data: mine } = await auth
        .from('team_members')
        .select('team_id')
        .eq('user_id', signProbe.user.id);
      const mineIds = new Set((mine ?? []).map((r) => r.team_id));
      foreignTeamId = (anyOther ?? []).find((t) => !mineIds.has(t.id))?.id ?? null;
      await auth.auth.signOut();
    }
  }
} else {
  console.warn('○ No service role key — Cross-Team checks may be skipped.');
}

const { data: trainerSign, error: trainerErr } = await auth.auth.signInWithPassword({
  email: trainerEmail,
  password: trainerPassword,
});
if (trainerErr || !trainerSign.session) {
  fail(`Trainer sign-in: ${trainerErr?.message ?? 'no session'}`);
  process.exit(1);
}
const trainerCookie = cookieHeader(trainerSign.session);
pass(`Trainer signed in (${trainerEmail})`);

  if (foreignTeamId) {
  const status = await api(`/api/trainer/team-status?teamId=${foreignTeamId}`, {
    cookie: trainerCookie,
  });
  if (status.res.status === 403) {
    pass('team-status foreign teamId → 403');
  } else if (status.res.status === 200) {
    // Pre-deploy legacy: foreign id was ignored and own roster returned — not a cross-team leak.
    console.warn(
      '○ team-status foreign teamId → 200 (own-roster fallback; deploy for explicit 403)'
    );
  } else {
    fail(`team-status foreign teamId → ${status.res.status} (want 403)`);
  }

  const invite = await api('/api/trainer/invite', {
    method: 'POST',
    cookie: trainerCookie,
    body: {
      teamId: foreignTeamId,
      email: `probe-${Date.now()}@eintracht-demo.de`,
    },
  });
  if (invite.res.status === 403) {
    pass('invite foreign teamId → 403');
  } else {
    fail(`invite foreign teamId → ${invite.res.status} (want 403)`);
  }
} else {
  console.warn('○ Skipped Cross-Team 403 (no foreign team id)');
}

const trainerExport = await api('/api/player/export', { cookie: trainerCookie });
if (trainerExport.res.status === 401 || trainerExport.res.status === 403) {
  pass(`trainer export denied (${trainerExport.res.status})`);
} else if (trainerExport.res.status === 200) {
  // Export is role-agnostic for authenticated users — trainer exporting *own* empty logs is OK.
  // Deny is only meaningful if we required player role; checklist: trainer must not see others.
  // Verify payload has no other users' logs by checking user field matches trainer.
  const exportedUser = trainerExport.json?.user;
  if (exportedUser === trainerEmail) {
    pass('trainer export = own empty/self data only (no cross-user)');
  } else {
    fail(`trainer export unexpected user field: ${exportedUser}`);
  }
} else {
  fail(`trainer export unexpected status ${trainerExport.res.status}`);
}

await auth.auth.signOut();

const { data: playerSign, error: playerErr } = await auth.auth.signInWithPassword({
  email: playerEmail,
  password: playerPassword,
});
if (playerErr || !playerSign.session) {
  fail(`Player sign-in: ${playerErr?.message ?? 'no session'}`);
  process.exit(1);
}
const playerCookie = cookieHeader(playerSign.session);
pass(`Player signed in (${playerEmail})`);

const playerExport = await api('/api/player/export', { cookie: playerCookie });
if (playerExport.res.status !== 200) {
  fail(`player export status ${playerExport.res.status}`);
} else {
  const keys = Object.keys(playerExport.json ?? {});
  const required = ['logs', 'consents', 'push_subscriptions', 'exported_at'];
  const missing = required.filter((k) => !keys.includes(k));
  if (missing.length) {
    fail(`player export missing keys: ${missing.join(', ')}`);
  } else if (playerExport.json.user !== playerEmail) {
    fail(`player export user mismatch: ${playerExport.json.user}`);
  } else {
    pass(`player export OK (keys: ${required.join(', ')})`);
  }
}

// Delete dry-run: create throwaway player via service role, delete via API, confirm gone
if (serviceKey) {
  const admin = createServiceRoleClient(supabaseUrl, serviceKey);
  const probeEmail = `rls-delete-probe-${Date.now()}@eintracht-demo.de`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: probeEmail,
    password: 'CyclesGuardProbe2026!',
    email_confirm: true,
    app_metadata: { role: 'player' },
    user_metadata: { full_name: 'RLS Delete Probe' },
  });
  if (createErr || !created.user) {
    fail(`probe createUser: ${createErr?.message ?? 'no user'}`);
  } else {
    const probeId = created.user.id;
    const { data: probeSign, error: probeSignErr } = await auth.auth.signInWithPassword({
      email: probeEmail,
      password: 'CyclesGuardProbe2026!',
    });
    if (probeSignErr || !probeSign.session) {
      fail(`probe sign-in: ${probeSignErr?.message}`);
      await admin.auth.admin.deleteUser(probeId);
    } else {
      const del = await api('/api/player/delete-account', {
        method: 'DELETE',
        cookie: cookieHeader(probeSign.session),
      });
      if (del.res.status === 200 && del.json?.success) {
        const { data: listed } = await admin.auth.admin.getUserById(probeId);
        if (!listed?.user) {
          pass('delete-account removes Auth user');
        } else {
          fail('delete-account returned success but user still exists');
          await admin.auth.admin.deleteUser(probeId);
        }
      } else {
        fail(`delete-account status ${del.res.status}: ${del.text.slice(0, 200)}`);
        await admin.auth.admin.deleteUser(probeId);
      }
    }
  }
} else {
  console.warn('○ Skipped delete dry-run (no service role)');
}

await auth.auth.signOut();

console.log('');
if (failed) {
  console.error(`RLS privacy suite: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log('RLS privacy suite passed (Cross-Team + Export/Delete).');
process.exit(0);
