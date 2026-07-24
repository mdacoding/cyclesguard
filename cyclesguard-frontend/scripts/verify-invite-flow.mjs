#!/usr/bin/env node
/**
 * Soft-Pilot onboarding surface check (Invite → set-password → consent pages).
 * Does not send real invites — verifies public/auth routes are live.
 *
 * Usage:
 *   npm run verify:invite-flow -- https://cyclesguard.vercel.app
 */
const baseUrl = (process.argv[2] ?? process.env.SITE_URL ?? 'https://cyclesguard.vercel.app').replace(
  /\/$/,
  ''
);

const paths = [
  '/login',
  '/auth/set-password',
  '/player/onboarding',
  '/trainer/onboarding',
  '/privacy',
  '/pilot',
  '/spielerinnen-info',
];

let failed = 0;

function pass(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

for (const path of paths) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const status = res.status;
    const ok =
      status === 200 ||
      status === 304 ||
      ((path.includes('/player/') || path.includes('/trainer/')) &&
        (status === 302 || status === 303 || status === 307 || status === 308));
    if (ok) {
      pass(`${path} → ${status}`);
    } else {
      fail(`${path} → ${status}`);
    }
  } catch (err) {
    fail(`${path} — ${err instanceof Error ? err.message : err}`);
  }
}

async function expectAuthDenied(path, body) {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) {
      pass(`POST ${path} unauth → ${res.status}`);
    } else {
      fail(`POST ${path} unauth → ${res.status} (want 401/403)`);
    }
  } catch (err) {
    fail(`${path} probe — ${err instanceof Error ? err.message : err}`);
  }
}

await expectAuthDenied('/api/trainer/invite', {
  teamId: '00000000-0000-4000-8000-000000000000',
  email: 'probe@example.com',
});
await expectAuthDenied('/api/admin/invite', {
  teamId: '00000000-0000-4000-8000-000000000000',
  email: 'probe@example.com',
  role: 'player',
});
await expectAuthDenied('/api/admin/invite/bulk', {
  teamId: '00000000-0000-4000-8000-000000000000',
  rows: [{ email: 'probe@example.com', role: 'player' }],
});

console.log('');
if (failed) {
  console.error(`Invite-flow surface: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log('Invite-flow surface OK against', baseUrl);
process.exit(0);
