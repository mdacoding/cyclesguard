import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { berlinDate, berlinWeekday, startOfBerlinDayUtc } from '@/lib/date';

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

  const payload = JSON.stringify({
    title: 'CyclesGuard',
    body: 'Zeichne deine Readiness für heute auf.',
  });

  for (const sub of subscriptions) {
    if (alreadyLogged.has(sub.user_id)) continue;
    if (isWeekend && sub.skip_weekends) {
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
