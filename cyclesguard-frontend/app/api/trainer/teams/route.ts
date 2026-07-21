import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isTrainer(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from('team_members')
    .select('team_id, teams(id, name, club_name)')
    .eq('user_id', user.id)
    .eq('role', 'trainer');

  if (error) {
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 });
  }

  const teams = (memberships ?? [])
    .map((m) => m.teams)
    .filter(Boolean)
    .flat()
    .map((t: { id: string; name: string; club_name: string | null }) => ({
      id: t.id,
      name: t.name,
      clubName: t.club_name,
    }));

  return NextResponse.json(teams);
}
