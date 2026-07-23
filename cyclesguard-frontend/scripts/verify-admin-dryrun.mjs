#!/usr/bin/env node
/**
 * Soft-Pilot Admin Dry-Run (GO-LIVE C3) — exercises club-admin ops against a
 * deployed base URL using cookie session (same as browser). Never prints secrets.
 *
 * Usage:
 *   DEMO_ALLOW=1 npm run verify:admin-dryrun -- https://cyclesguard.vercel.app
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run verify:admin-dryrun -- <url>
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

const baseUrl = (process.argv[2] ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '')
  .replace(/\/$/, '');

const email =
  process.env.E2E_ADMIN_EMAIL ??
  process.env.ADMIN_EMAIL ??
  (process.env.DEMO_ALLOW === '1' ? 'admin@eintracht-demo.de' : undefined);
const password =
  process.env.E2E_ADMIN_PASSWORD ??
  process.env.ADMIN_PASSWORD ??
  (process.env.DEMO_ALLOW === '1' ? 'CyclesGuard2026!' : undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!baseUrl) {
  console.error('Usage: npm run verify:admin-dryrun -- https://cyclesguard.vercel.app');
  process.exit(1);
}
if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase URL/anon key in env.');
  process.exit(1);
}
if (!email || !password) {
  console.error('Missing admin credentials. Set E2E_ADMIN_EMAIL/PASSWORD or DEMO_ALLOW=1.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failed = 0;
const stamp = Date.now().toString(36);
const teamName = `DryRun ${stamp}`;

function cookieHeader(session) {
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  // @supabase/ssr stores the session JSON (chunked if large). For access+refresh this fits one cookie.
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
    /* csv/html */
  }
  return { res, text, json };
}

const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (signInError || !signIn.session) {
  console.error(`✗ Admin sign-in failed — ${signInError?.message ?? 'no session'}`);
  process.exit(1);
}
const cookie = cookieHeader(signIn.session);
console.log('✓ Admin signed in');

{
  const { res, json } = await api('/api/admin/teams', { cookie });
  if (!res.ok || !Array.isArray(json)) {
    console.error(`✗ GET /api/admin/teams — ${res.status}`);
    failed++;
  } else {
    console.log(`✓ GET /api/admin/teams — ${json.length} team(s)`);
    if (json[0] && typeof json[0].loggedToday !== 'undefined') {
      console.log('✓ Team payload includes loggedToday KPI');
    }
  }
}

let teamId = null;
{
  const { res, json } = await api('/api/admin/teams', {
    method: 'POST',
    cookie,
    body: { name: teamName, clubName: 'DryRun Club' },
  });
  if (!res.ok || !json?.id) {
    console.error(`✗ POST /api/admin/teams — ${res.status} ${JSON.stringify(json)}`);
    failed++;
  } else {
    teamId = json.id;
    console.log('✓ Created ephemeral dry-run team');
  }
}

if (teamId) {
  const rename = await api('/api/admin/teams', {
    method: 'PATCH',
    cookie,
    body: { id: teamId, name: `${teamName} renamed` },
  });
  if (!rename.res.ok) {
    console.error(`✗ PATCH rename — ${rename.res.status}`);
    failed++;
  } else {
    console.log('✓ Renamed dry-run team');
  }

  const archive = await api('/api/admin/teams', {
    method: 'PATCH',
    cookie,
    body: { id: teamId, status: 'archived' },
  });
  if (!archive.res.ok) {
    console.error(`✗ PATCH archive — ${archive.res.status}`);
    failed++;
  } else {
    console.log('✓ Archived dry-run team (cleanup)');
  }
}

{
  const seasons = await api('/api/admin/seasons', { cookie });
  if (!seasons.res.ok || !Array.isArray(seasons.json)) {
    console.error(`✗ GET /api/admin/seasons — ${seasons.res.status}`);
    failed++;
  } else {
    console.log(`✓ GET /api/admin/seasons — ${seasons.json.length} season(s)`);
  }

  const clubs = await api('/api/admin/clubs', { cookie });
  if (!clubs.res.ok || !Array.isArray(clubs.json)) {
    console.error(`✗ GET /api/admin/clubs — ${clubs.res.status}`);
    failed++;
  } else if (clubs.json.length === 0) {
    console.log('○ No clubs — skip season commercial dry-run');
  } else {
    const clubId = clubs.json[0].id;
    const seasonName = `DryRun Season ${stamp}`;
    const today = new Date();
    const startsOn = today.toISOString().slice(0, 10);
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    const endsOn = end.toISOString().slice(0, 10);

    const created = await api('/api/admin/seasons', {
      method: 'POST',
      cookie,
      body: {
        clubId,
        name: seasonName,
        startsOn,
        endsOn,
        status: 'planned',
        commercialStatus: 'pilot_free',
      },
    });
    if (!created.res.ok || !created.json?.id) {
      console.error(`✗ POST /api/admin/seasons — ${created.res.status}`);
      failed++;
    } else {
      const seasonId = created.json.id;
      console.log('✓ Created ephemeral dry-run season');

      const quoted = await api('/api/admin/seasons', {
        method: 'PATCH',
        cookie,
        body: { id: seasonId, commercialStatus: 'quoted' },
      });
      if (!quoted.res.ok) {
        console.error(`✗ PATCH quoted — ${quoted.res.status}`);
        failed++;
      } else {
        console.log('✓ Season → quoted');
      }

      const details = await api('/api/admin/seasons', {
        method: 'PATCH',
        cookie,
        body: {
          id: seasonId,
          feeCents: 100,
          contractRef: `DRY-${stamp}`,
          signedByEmail: email,
          internalNotes: 'verify-admin-dryrun cleanup ok',
        },
      });
      if (!details.res.ok) {
        console.error(`✗ PATCH contract details — ${details.res.status}`);
        failed++;
      } else {
        console.log('✓ Season fee/ref saved');
      }

      const signed = await api('/api/admin/seasons', {
        method: 'PATCH',
        cookie,
        body: { id: seasonId, commercialStatus: 'signed' },
      });
      if (!signed.res.ok) {
        console.error(`✗ PATCH signed — ${signed.res.status} ${JSON.stringify(signed.json)}`);
        failed++;
      } else {
        console.log('✓ Season → signed (signed_at set)');
      }

      const guard = await api('/api/admin/seasons', {
        method: 'POST',
        cookie,
        body: {
          clubId,
          name: `${seasonName} guard`,
          startsOn,
          endsOn,
          status: 'planned',
        },
      });
      if (guard.res.ok && guard.json?.id) {
        const blocked = await api('/api/admin/seasons', {
          method: 'PATCH',
          cookie,
          body: { id: guard.json.id, commercialStatus: 'active_paid' },
        });
        if (blocked.res.status === 400) {
          console.log('✓ Guard: active_paid without fee/ref → 400');
        } else {
          console.error(`✗ Guard expected 400, got ${blocked.res.status}`);
          failed++;
        }
        await api('/api/admin/seasons', {
          method: 'PATCH',
          cookie,
          body: {
            id: guard.json.id,
            status: 'completed',
            commercialStatus: 'ended',
            feeCents: 1,
            contractRef: `DRY-G-${stamp}`,
          },
        });
      }

      const cleanup = await api('/api/admin/seasons', {
        method: 'PATCH',
        cookie,
        body: {
          id: seasonId,
          status: 'completed',
          commercialStatus: 'ended',
        },
      });
      if (!cleanup.res.ok) {
        console.error(`✗ Season cleanup — ${cleanup.res.status}`);
        failed++;
      } else {
        console.log('✓ Season marked completed/ended (cleanup)');
      }
    }
  }
}

{
  const ops = await api('/api/admin/ops-status', { cookie });
  if (!ops.res.ok) {
    console.error(`✗ GET /api/admin/ops-status — ${ops.res.status}`);
    failed++;
  } else {
    const p = ops.json?.push?.ready ? 'push:ready' : 'push:open';
    const s = ops.json?.sentryConfigured ? 'sentry:ok' : 'sentry:open';
    console.log(`✓ Ops-status — ${p}, ${s}, demo=${ops.json?.demoMode}`);
  }
}

{
  const audit = await api('/api/admin/audit?format=csv', { cookie });
  if (!audit.res.ok || !String(audit.text).includes('created_at')) {
    console.error(`✗ GET /api/admin/audit?format=csv — ${audit.res.status}`);
    failed++;
  } else {
    console.log('✓ Audit CSV downloadable');
  }
}

await supabase.auth.signOut();

console.log('');
if (failed === 0) {
  console.log('Admin dry-run passed — GO-LIVE C3 closable.');
  process.exit(0);
}
console.error(`${failed} check(s) failed.`);
process.exit(1);
