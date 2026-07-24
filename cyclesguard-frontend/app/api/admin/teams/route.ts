import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';
import { startOfBerlinDayUtc } from '@/lib/date';
import { buildAdherenceSeries } from '@/lib/adherence';

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
    if (clubIds.length === 0) {
      if (new URL(request.url).searchParams.get('format') === 'csv') {
        return new NextResponse(
          'team,club,status,players,logged_today,logged_7d,still_7d,adherence_pct,trainers,trainers_active_7d\n',
          {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': 'attachment; filename="cyclesguard-adherence.csv"',
            },
          }
        );
      }
      return NextResponse.json([]);
    }
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
  const trainersByTeam = new Map<string, string[]>();
  const trainerLastSeen = new Map<string, string | null>();

  if (teamIds.length > 0) {
    const { data: allMembers } = await admin
      .from('team_members')
      .select('team_id, user_id, role, last_seen_at')
      .in('team_id', teamIds)
      .in('role', ['player', 'trainer']);

    for (const row of allMembers ?? []) {
      if (row.role === 'player') {
        const list = playersByTeam.get(row.team_id) ?? [];
        list.push(row.user_id);
        playersByTeam.set(row.team_id, list);
      } else if (row.role === 'trainer') {
        const list = trainersByTeam.get(row.team_id) ?? [];
        list.push(row.user_id);
        trainersByTeam.set(row.team_id, list);
        trainerLastSeen.set(row.user_id, (row.last_seen_at as string | null) ?? null);
      }
    }
  }

  const allPlayerIds = Array.from(
    new Set(Array.from(playersByTeam.values()).flat())
  );
  const loggedUsers = new Set<string>();
  const loggedTodayUsers = new Set<string>();
  let recentLogs: { user_id: string; logged_at: string }[] = [];
  if (allPlayerIds.length > 0) {
    const todayStart = startOfBerlinDayUtc().toISOString();
    const { data: logs } = await admin
      .from('cycle_logs')
      .select('user_id, logged_at')
      .in('user_id', allPlayerIds)
      .gte('logged_at', sevenDaysAgo.toISOString());
    recentLogs = (logs ?? []).map((l) => ({
      user_id: l.user_id as string,
      logged_at: l.logged_at as string,
    }));
    for (const l of recentLogs) {
      loggedUsers.add(l.user_id);
      if (l.logged_at && l.logged_at >= todayStart) {
        loggedTodayUsers.add(l.user_id);
      }
    }
  }

  const result = [];
  for (const team of teams ?? []) {
    const playerIds = playersByTeam.get(team.id) ?? [];
    const trainerIds = trainersByTeam.get(team.id) ?? [];
    const loggedLast7Days = playerIds.filter((id) => loggedUsers.has(id)).length;
    const loggedToday = playerIds.filter((id) => loggedTodayUsers.has(id)).length;
    const trainersActive7d = trainerIds.filter((id) => {
      const seen = trainerLastSeen.get(id);
      return seen != null && seen >= sevenDaysAgo.toISOString();
    }).length;
    const adherenceSeries7d = buildAdherenceSeries(playerIds, recentLogs, 7);

    result.push({
      id: team.id,
      name: team.name,
      clubName: team.club_name,
      status: team.status ?? 'active',
      playerCount: playerIds.length,
      loggedLast7Days,
      loggedToday,
      trainerCount: trainerIds.length,
      trainersActive7d,
      adherenceSeries7d,
    });
  }

  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`;
    const header =
      'team,club,status,players,logged_today,logged_7d,still_7d,adherence_pct,trainers,trainers_active_7d\n';
    const body = result
      .map((t) => {
        const adherence =
          t.playerCount === 0 ? '' : String(Math.round((t.loggedLast7Days / t.playerCount) * 100));
        return [
          t.name,
          t.clubName ?? '',
          t.status,
          String(t.playerCount),
          String(t.loggedToday),
          String(t.loggedLast7Days),
          String(Math.max(0, t.playerCount - t.loggedLast7Days)),
          adherence,
          String(t.trainerCount),
          String(t.trainersActive7d),
        ]
          .map(esc)
          .join(',');
      })
      .join('\n');
    return new NextResponse(header + body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cyclesguard-adherence.csv"',
      },
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
