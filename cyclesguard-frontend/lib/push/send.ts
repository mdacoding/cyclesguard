import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

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
}

/**
 * Daily reminder payload stays generic — no cycle/medical wording in OS previews.
 */
export async function sendDailyReminders(): Promise<PushSendStats> {
  ensureVapid();
  const admin = createAdminClient();

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth');

  if (error || !subscriptions) {
    console.error('Failed to load push subscriptions', error);
    return { sent: 0, failed: 0, pruned: 0 };
  }

  const berlinDay = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
  const { data: loggedToday } = await admin
    .from('cycle_logs')
    .select('user_id')
    .gte('logged_at', `${berlinDay}T00:00:00.000Z`);

  const alreadyLogged = new Set((loggedToday ?? []).map((r) => r.user_id));

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  const payload = JSON.stringify({
    title: 'CyclesGuard',
    body: 'Zeichne deine Readiness für heute auf.',
  });

  for (const sub of subscriptions) {
    if (alreadyLogged.has(sub.user_id)) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent += 1;
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
    JSON.stringify({ event: 'daily_reminders', sent, failed, pruned })
  );
  return { sent, failed, pruned };
}
