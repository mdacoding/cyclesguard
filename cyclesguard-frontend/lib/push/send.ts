import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { berlinDate, berlinWeekday, startOfBerlinDayUtc } from '@/lib/date';
import {
  buildDailyReminderPayload,
  buildTrainerNudgePayload,
  shouldSkipWeekendReminder,
} from '@/lib/push/payload';

let configured = false;

function ensureVapid() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured');
  }
  webpush.setVapidDetails('mailto:privacy@cyclesguard.de', publicKey, privateKey);
  configured = true;
}

export interface PushSendStats {
  sent: number;
  failed: number;
  pruned: number;
  skippedWeekend: number;
}

export interface NudgeSendStats {
  sent: number;
  failed: number;
  pruned: number;
  skippedNoSub: number;
  skippedAlreadyLogged: number;
}

/**
 * Daily reminder payload stays generic — no cycle/medical wording in OS previews.
 */
export async function sendDailyReminders(): Promise<PushSendStats> {
  ensureVapid();
  const admin = createAdminClient();

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth, skip_weekends');

  if (error || !subscriptions) {
    console.error('Failed to load push subscriptions', error);
    return { sent: 0, failed: 0, pruned: 0, skippedWeekend: 0 };
  }

  const weekday = berlinWeekday();
  const isWeekend = weekday === 0 || weekday === 6;
  const dayStart = startOfBerlinDayUtc(berlinDate()).toISOString();

  const { data: loggedToday } = await admin
    .from('cycle_logs')
    .select('user_id')
    .gte('logged_at', dayStart);

  const alreadyLogged = new Set((loggedToday ?? []).map((r) => r.user_id));

  let sent = 0;
  let failed = 0;
  let pruned = 0;
  let skippedWeekend = 0;

  const payload = buildDailyReminderPayload();

  for (const sub of subscriptions) {
    if (alreadyLogged.has(sub.user_id)) continue;
    if (shouldSkipWeekendReminder(isWeekend, sub.skip_weekends)) {
      skippedWeekend += 1;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent += 1;
      await admin
        .from('push_subscriptions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', sub.id);
    } catch (err: unknown) {
      const statusCode =
        typeof err === 'object' && err && 'statusCode' in err
          ? Number((err as { statusCode: number }).statusCode)
          : 0;

      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
        pruned += 1;
      } else {
        failed += 1;
      }
    }
  }

  console.info(
    JSON.stringify({ event: 'daily_reminders', sent, failed, pruned, skippedWeekend })
  );
  return { sent, failed, pruned, skippedWeekend };
}

/**
 * Trainer-triggered nudge for players who have not logged today.
 * Coach-safe payload only — never includes health fields or names.
 */
export async function sendTrainerNudges(playerIds: string[]): Promise<NudgeSendStats> {
  ensureVapid();
  const admin = createAdminClient();
  const uniqueIds = Array.from(new Set(playerIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { sent: 0, failed: 0, pruned: 0, skippedNoSub: 0, skippedAlreadyLogged: 0 };
  }

  const dayStart = startOfBerlinDayUtc(berlinDate()).toISOString();
  const { data: loggedToday } = await admin
    .from('cycle_logs')
    .select('user_id')
    .in('user_id', uniqueIds)
    .gte('logged_at', dayStart);
  const alreadyLogged = new Set((loggedToday ?? []).map((r) => r.user_id));

  const targets = uniqueIds.filter((id) => !alreadyLogged.has(id));
  const skippedAlreadyLogged = uniqueIds.length - targets.length;

  if (targets.length === 0) {
    return { sent: 0, failed: 0, pruned: 0, skippedNoSub: 0, skippedAlreadyLogged };
  }

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', targets);

  if (error) {
    console.error('Failed to load nudge subscriptions', error);
    return {
      sent: 0,
      failed: targets.length,
      pruned: 0,
      skippedNoSub: 0,
      skippedAlreadyLogged,
    };
  }

  const byUser = new Map<string, NonNullable<typeof subscriptions>>();
  for (const sub of subscriptions ?? []) {
    const list = byUser.get(sub.user_id) ?? [];
    list.push(sub);
    byUser.set(sub.user_id, list);
  }

  let sent = 0;
  let failed = 0;
  let pruned = 0;
  let skippedNoSub = 0;
  const payload = buildTrainerNudgePayload();

  for (const userId of targets) {
    const subs = byUser.get(userId);
    if (!subs || subs.length === 0) {
      skippedNoSub += 1;
      continue;
    }
    let userSent = false;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        userSent = true;
        await admin
          .from('push_subscriptions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', sub.id);
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err && 'statusCode' in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
          pruned += 1;
        }
      }
    }
    if (userSent) sent += 1;
    else failed += 1;
  }

  console.info(
    JSON.stringify({
      event: 'trainer_nudge',
      sent,
      failed,
      pruned,
      skippedNoSub,
      skippedAlreadyLogged,
    })
  );
  return { sent, failed, pruned, skippedNoSub, skippedAlreadyLogged };
}
