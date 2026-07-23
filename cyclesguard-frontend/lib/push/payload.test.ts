import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyReminderPayload,
  pushPayloadIsCoachSafe,
  shouldSkipWeekendReminder,
  DAILY_REMINDER_BODY,
} from '@/lib/push/payload';

test('daily reminder payload has no medical / cycle wording', () => {
  const payload = buildDailyReminderPayload();
  assert.equal(pushPayloadIsCoachSafe(payload), true);
  assert.match(DAILY_REMINDER_BODY, /Readiness/i);
  assert.doesNotMatch(payload, /menstru|zyklus|eisprung|ovulation/i);
});

test('weekend skip preference', () => {
  assert.equal(shouldSkipWeekendReminder(true, true), true);
  assert.equal(shouldSkipWeekendReminder(true, false), false);
  assert.equal(shouldSkipWeekendReminder(false, true), false);
  assert.equal(shouldSkipWeekendReminder(false, false), false);
});
