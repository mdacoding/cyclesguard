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

for (const path of paths) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const status = res.status;
    // 200 OK, or auth redirect to login (302/307) for protected onboarding when logged out
    const ok =
      status === 200 ||
      status === 304 ||
      ((path.includes('/player/') || path.includes('/trainer/')) &&
        (status === 302 || status === 303 || status === 307 || status === 308));
    if (ok) {
      console.log(`✓ ${path} → ${status}`);
    } else {
      console.error(`✗ ${path} → ${status}`);
      failed += 1;
    }
  } catch (err) {
    console.error(`✗ ${path} — ${err instanceof Error ? err.message : err}`);
    failed += 1;
  }
}

// Unauthenticated invite must not succeed
try {
  const res = await fetch(`${baseUrl}/api/trainer/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamId: '00000000-0000-4000-8000-000000000000',
      email: 'probe@example.com',
    }),
  });
  if (res.status === 401 || res.status === 403) {
    console.log(`✓ POST /api/trainer/invite unauth → ${res.status}`);
  } else {
    console.error(`✗ POST /api/trainer/invite unauth → ${res.status} (want 401/403)`);
    failed += 1;
  }
} catch (err) {
  console.error(`✗ invite probe — ${err instanceof Error ? err.message : err}`);
  failed += 1;
}

console.log('');
if (failed) {
  console.error(`Invite-flow surface: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log('Invite-flow surface OK against', baseUrl);
process.exit(0);
