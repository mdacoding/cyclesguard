import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyReminderPayload,
  buildTrainerNudgePayload,
  pushPayloadIsCoachSafe,
  shouldSkipWeekendReminder,
  DAILY_REMINDER_BODY,
  TRAINER_NUDGE_BODY,
} from '@/lib/push/payload';

test('daily reminder payload has no medical / cycle wording', () => {
  const payload = buildDailyReminderPayload();
  assert.equal(pushPayloadIsCoachSafe(payload), true);
  assert.match(DAILY_REMINDER_BODY, /Readiness/i);
  assert.doesNotMatch(payload, /menstru|zyklus|eisprung|ovulation/i);
});

test('trainer nudge payload is coach-safe', () => {
  const payload = buildTrainerNudgePayload();
  assert.equal(pushPayloadIsCoachSafe(payload), true);
  assert.match(TRAINER_NUDGE_BODY, /Readiness/i);
  assert.doesNotMatch(payload, /menstru|zyklus|eisprung|ovulation|ampel|rest|phase/i);
  assert.doesNotMatch(payload, /FIT|MODIFIED|NO_DATA/i);
});

test('weekend skip preference', () => {
  assert.equal(shouldSkipWeekendReminder(true, true), true);
  assert.equal(shouldSkipWeekendReminder(true, false), false);
  assert.equal(shouldSkipWeekendReminder(false, true), false);
  assert.equal(shouldSkipWeekendReminder(false, false), false);
});
