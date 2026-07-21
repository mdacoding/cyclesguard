import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** CTO retention: prune stale push subscriptions older than 180 days without activity proxy. */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180);

  const { data, error } = await admin
    .from('push_subscriptions')
    .delete()
    .lt('created_at', cutoff.toISOString())
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Retention job failed' }, { status: 500 });
  }

  const pruned = data?.length ?? 0;
  console.info(JSON.stringify({ event: 'retention', pruned }));
  return NextResponse.json({ ok: true, pruned });
}
