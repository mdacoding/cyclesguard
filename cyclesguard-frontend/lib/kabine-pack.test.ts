import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGroupedAmpelShareText } from '@/lib/kabine-pack';

test('grouped Ampel share has status headers and no medical terms', () => {
  const text = buildGroupedAmpelShareText({
    teamName: 'Demo Frauen',
    loggedTodayCount: 1,
    sessionMode: true,
    when: new Date('2026-07-24T10:00:00+02:00'),
    members: [
      {
        name: 'Anna',
        status: 'REST',
        loadFlag: 'NORMAL',
        loggedToday: true,
        daysSinceLog: 0,
      },
      {
        name: 'Bella',
        status: 'FIT',
        loadFlag: 'UNKNOWN',
        loggedToday: false,
        daysSinceLog: 2,
      },
      {
        name: 'Cara',
        status: 'FIT',
        loadFlag: 'HIGH',
        loggedToday: false,
        daysSinceLog: null,
      },
    ],
  });
  assert.match(text, /Session-Freeze/);
  assert.match(text, /Regeneration/);
  assert.match(text, /Anna/);
  assert.match(text, /Bella/);
  assert.match(text, /Cara/);
  assert.doesNotMatch(text, /menstru|zyklus|eisprung|ovulation|phase/i);
  // FIT group after REST
  assert.ok(text.indexOf('Anna') < text.indexOf('Bella'));
});
