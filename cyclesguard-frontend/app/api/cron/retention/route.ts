import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authorizeCron } from '@/lib/cron-auth';

/** CTO retention: prune push subscriptions inactive for 180+ days (last_seen_at). */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180);

  const { data, error } = await admin
    .from('push_subscriptions')
    .delete()
    .lt('last_seen_at', cutoff.toISOString())
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Retention job failed' }, { status: 500 });
  }

  const pruned = data?.length ?? 0;
  console.info(JSON.stringify({ event: 'retention', pruned }));
  return NextResponse.json({ ok: true, pruned });
}
