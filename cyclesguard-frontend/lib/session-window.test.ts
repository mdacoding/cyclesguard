import test from 'node:test';
import assert from 'node:assert/strict';
import {
  minutesUntilSession,
  isWithinPreSessionWindow,
  parseSessionTime,
} from '@/lib/session-window';

test('parseSessionTime accepts HH:MM', () => {
  assert.deepEqual(parseSessionTime('18:00'), { hours: 18, minutes: 0 });
  assert.equal(parseSessionTime('25:00'), null);
  assert.equal(parseSessionTime('abc'), null);
});

test('minutesUntilSession only for matching Berlin day', () => {
  const now = new Date('2026-07-24T15:00:00+02:00');
  const berlinDay = '2026-07-24';
  const mins = minutesUntilSession({ time: '18:00', date: berlinDay }, now);
  assert.equal(mins, 180);
  assert.equal(minutesUntilSession({ time: '18:00', date: '2026-07-23' }, now), null);
});

test('isWithinPreSessionWindow 90 min', () => {
  const now = new Date('2026-07-24T17:00:00+02:00');
  assert.equal(
    isWithinPreSessionWindow({ time: '18:00', date: '2026-07-24' }, now),
    true
  );
  assert.equal(
    isWithinPreSessionWindow({ time: '20:00', date: '2026-07-24' }, now),
    false
  );
});
