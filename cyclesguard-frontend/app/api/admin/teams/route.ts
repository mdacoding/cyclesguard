import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(120),
  clubName: z.string().max(120).optional(),
  clubId: z.string().uuid().optional(),
});

const PatchTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  clubName: z.string().max(120).nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === '1';
  const admin = createAdminClient();

  const { data: clubMemberships } = await admin
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)
    .eq('role', 'club_admin');

  const clubIds = (clubMemberships ?? []).map((c) => c.club_id);
  let teamsQuery = admin.from('teams').select('id, name, club_name, club_id, status');
  if (user.app_metadata?.role !== 'platform_admin') {
    if (clubIds.length === 0) return NextResponse.json([]);
    teamsQuery = teamsQuery.in('club_id', clubIds);
  }
  if (!includeArchived) {
    teamsQuery = teamsQuery.eq('status', 'active');
  }

  const { data: teams, error } = await teamsQuery;
  if (error) return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const teamIds = (teams ?? []).map((t) => t.id);
  const playersByTeam = new Map<string, string[]>();

  if (teamIds.length > 0) {
    const { data: allPlayers } = await admin
      .from('team_members')
      .select('team_id, user_id')
      .in('team_id', teamIds)
      .eq('role', 'player');

    for (const row of allPlayers ?? []) {
      const list = playersByTeam.get(row.team_id) ?? [];
      list.push(row.user_id);
      playersByTeam.set(row.team_id, list);
    }
  }

  const allPlayerIds = Array.from(
    new Set(Array.from(playersByTeam.values()).flat())
  );
  const loggedUsers = new Set<string>();
  if (allPlayerIds.length > 0) {
    const { data: logs } = await admin
      .from('cycle_logs')
      .select('user_id')
      .in('user_id', allPlayerIds)
      .gte('logged_at', sevenDaysAgo.toISOString());
    for (const l of logs ?? []) loggedUsers.add(l.user_id);
  }

  const result = [];
  for (const team of teams ?? []) {
    const playerIds = playersByTeam.get(team.id) ?? [];
    const loggedLast7Days = playerIds.filter((id) => loggedUsers.has(id)).length;

    result.push({
      id: team.id,
      name: team.name,
      clubName: team.club_name,
      status: team.status ?? 'active',
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
      status: 'active',
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

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = PatchTeamSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const scoped = await assertClubScope(
    admin,
    user.id,
    parsed.data.id,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patch: Record<string, string | null> = {};
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.clubName !== undefined) patch.club_name = parsed.data.clubName;
  if (parsed.data.status) patch.status = parsed.data.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await admin.from('teams').update(patch).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: parsed.data.status === 'archived' ? 'archive_team' : 'update_team',
    metadata: { team_id: parsed.data.id, ...patch },
  });

  return NextResponse.json({ ok: true });
}
