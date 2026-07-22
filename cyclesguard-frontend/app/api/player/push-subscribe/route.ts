import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  skipWeekends: z.boolean().optional(),
});

const PrefsSchema = z.object({
  skipWeekends: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const result = PushSubscriptionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid subscription', details: result.error.format() },
      { status: 400 }
    );
  }

  const { endpoint, keys, skipWeekends } = result.data;

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      last_seen_at: new Date().toISOString(),
      ...(typeof skipWeekends === 'boolean' ? { skip_weekends: skipWeekends } : {}),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** Update reminder prefs on existing subscriptions without re-subscribing. */
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = PrefsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .update({
      skip_weekends: parsed.data.skipWeekends,
      last_seen_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update prefs' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('push_subscriptions')
    .select('skip_weekends')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    skipWeekends: data?.skip_weekends ?? false,
  });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    const body = await request.json();
    endpoint = body.endpoint;
  } catch {
    // DELETE without body removes all subscriptions for user
  }

  let deleteQuery = supabase.from('push_subscriptions').delete().eq('user_id', user.id);
  if (endpoint) {
    deleteQuery = deleteQuery.eq('endpoint', endpoint);
  }

  const { error } = await deleteQuery;

  if (error) {
    console.error('Failed to delete push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
