import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlayerSharePack,
  buildStaffSharePack,
  buildInvitePendingPack,
} from '@/lib/soft-pilot-pack';

test('player and staff packs are coach-safe', () => {
  const player = buildPlayerSharePack();
  const staff = buildStaffSharePack({ clubLabel: 'Demo' });
  for (const text of [player, staff]) {
    assert.match(text, /Ampel|Readiness|Kabine/);
    assert.doesNotMatch(text, /menstru|zyklus|eisprung|symptom|periode/i);
  }
  assert.match(player, /spielerinnen-info/);
  assert.match(staff, /trainer\/dashboard/);
});

test('invite pending pack lists names only', () => {
  const text = buildInvitePendingPack({ names: ['Anna', 'Bella'] });
  assert.match(text, /Anna/);
  assert.match(text, /Bella/);
  assert.match(text, /login/i);
  assert.doesNotMatch(text, /menstru|phase|FIT|REST/i);
});
