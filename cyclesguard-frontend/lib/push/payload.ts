/** Daily reminder OS preview — must stay free of cycle/medical wording. */
export const DAILY_REMINDER_TITLE = 'CyclesGuard';
export const DAILY_REMINDER_BODY = 'Zeichne deine Readiness für heute auf.';

export function buildDailyReminderPayload(): string {
  return JSON.stringify({
    title: DAILY_REMINDER_TITLE,
    body: DAILY_REMINDER_BODY,
  });
}

const MEDICAL_LEAK =
  /menstru|zyklus|eisprung|ovulation|follikel|luteal|periode|blutung|symptom/i;

export function pushPayloadIsCoachSafe(payloadJson: string): boolean {
  return !MEDICAL_LEAK.test(payloadJson);
}

/** Pure weekend skip rule used by the daily-reminder cron. */
export function shouldSkipWeekendReminder(
  isWeekend: boolean,
  skipWeekends: boolean | null | undefined
): boolean {
  return Boolean(isWeekend && skipWeekends);
}
