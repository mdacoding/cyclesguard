import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(120),
  clubName: z.string().max(120).optional(),
  clubId: z.string().uuid().optional(),
});

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();

  const { data: clubMemberships } = await admin
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)
    .eq('role', 'club_admin');

  const clubIds = (clubMemberships ?? []).map((c) => c.club_id);
  let teamsQuery = admin.from('teams').select('id, name, club_name, club_id');
  if (user.app_metadata?.role !== 'platform_admin') {
    if (clubIds.length === 0) return NextResponse.json([]);
    teamsQuery = teamsQuery.in('club_id', clubIds);
  }

  const { data: teams, error } = await teamsQuery;
  if (error) return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = [];
  for (const team of teams ?? []) {
    const { data: players } = await admin
      .from('team_members')
      .select('user_id')
      .eq('team_id', team.id)
      .eq('role', 'player');

    const playerIds = (players ?? []).map((p) => p.user_id);
    let loggedLast7Days = 0;
    if (playerIds.length > 0) {
      const { data: logs } = await admin
        .from('cycle_logs')
        .select('user_id')
        .in('user_id', playerIds)
        .gte('logged_at', sevenDaysAgo.toISOString());
      loggedLast7Days = new Set((logs ?? []).map((l) => l.user_id)).size;
    }

    result.push({
      id: team.id,
      name: team.name,
      clubName: team.club_name,
      playerCount: playerIds.length,
      loggedLast7Days,
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = CreateTeamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  let clubId = parsed.data.clubId ?? null;

  if (!clubId && user.app_metadata?.role !== 'platform_admin') {
    const { data: memberships } = await admin
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('role', 'club_admin')
      .limit(1);
    clubId = memberships?.[0]?.club_id ?? null;
  }

  const { data: team, error } = await admin
    .from('teams')
    .insert({
      name: parsed.data.name,
      club_name: parsed.data.clubName ?? null,
      club_id: clubId,
    })
    .select('id')
    .single();

  if (error || !team) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'create_team',
    metadata: { team_id: team.id, name: parsed.data.name },
  });

  return NextResponse.json({ id: team.id }, { status: 201 });
}
