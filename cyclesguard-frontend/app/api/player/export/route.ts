import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [logs, consents, pushSubs, summaries, links] = await Promise.all([
    supabase.from('cycle_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }),
    supabase.from('player_consents').select('id, health_data_consent_at, terms_accepted_at, created_at').eq('user_id', user.id),
    supabase.from('push_subscriptions').select('id, endpoint, created_at').eq('user_id', user.id),
    supabase.from('session_summaries').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
    supabase.from('athlete_links').select('id, provider, external_athlete_id, team_id, created_at').eq('user_id', user.id),
  ]);

  if (logs.error) {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }

  const exportData = {
    user: user.email,
    exported_at: new Date().toISOString(),
    logs: logs.data,
    consents: consents.data ?? [],
    push_subscriptions: pushSubs.data ?? [],
    session_summaries: summaries.data ?? [],
    athlete_links: links.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="cyclesguard-export.json"',
    },
  });
}
