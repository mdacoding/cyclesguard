import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveKabineDay1State, buildKabineDay1Checklist } from '@/lib/kabine-day1';

test('resolveKabineDay1State priority', () => {
  assert.equal(resolveKabineDay1State({ teamCount: 0, rosterCount: 0, invitePendingCount: 0, loggedTodayCount: 0 }), 'no_team');
  assert.equal(resolveKabineDay1State({ teamCount: 1, rosterCount: 0, invitePendingCount: 0, loggedTodayCount: 0 }), 'empty_roster');
  assert.equal(
    resolveKabineDay1State({ teamCount: 1, rosterCount: 3, invitePendingCount: 3, loggedTodayCount: 0 }),
    'all_invite_pending'
  );
  assert.equal(
    resolveKabineDay1State({ teamCount: 1, rosterCount: 3, invitePendingCount: 1, loggedTodayCount: 0 }),
    'zero_logs_today'
  );
  assert.equal(
    resolveKabineDay1State({ teamCount: 1, rosterCount: 3, invitePendingCount: 0, loggedTodayCount: 2 }),
    'ready'
  );
});

test('checklist marks session steps from flags', () => {
  const items = buildKabineDay1Checklist({
    state: 'zero_logs_today',
    hasSessionWindow: true,
    sessionMode: false,
  });
  assert.equal(items.find((i) => i.id === 'session_time')?.done, true);
  assert.equal(items.find((i) => i.id === 'freeze')?.done, false);
  assert.equal(items.find((i) => i.id === 'invite')?.done, true);
});
