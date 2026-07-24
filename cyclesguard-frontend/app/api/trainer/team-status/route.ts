import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';
import { getTrainerTeamIds, getTeamPlayerIds } from '@/lib/teams';
import {
  mapCycleToStatus,
  buildTrainerInsight,
  computeReadinessTrend7d,
  ReadinessStatus,
  LoadFlag,
  ReadinessTrend7d,
} from '@/lib/trainer-status';
import { CyclePhase } from '@/lib/types';
import { berlinCalendarDaysBetween, isSameBerlinDay } from '@/lib/date';
import { assertCoachSafeTeamStatus } from '@/lib/trainer-status-contract';

export interface TeamStatusEntry {
  playerId: string;
  name: string;
  status: ReadinessStatus;
  loadFlag: LoadFlag;
  recommendation: string;
  /** Coach-safe: logged on Berlin calendar day — no phase/symptoms. */
  loggedToday: boolean;
  /** Coach-safe: Berlin calendar days since last log; null = never logged. */
  daysSinceLog: number | null;
  /** Coach-safe: never completed first login — invite/setup mail may be resent. */
  invitePending: boolean;
}

export interface TeamStatusResponse {
  players: TeamStatusEntry[];
  /** Coach-safe 7d histogram of player-days (no health fields). */
  trend7d: ReadinessTrend7d;
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const requestedTeamId = searchParams.get('teamId');

  const trainerTeamIds = await getTrainerTeamIds(user.id);
  if (trainerTeamIds.length === 0) {
    return NextResponse.json({
      players: [],
      trend7d: { FIT: 0, MODIFIED_TRAINING: 0, REST: 0, NO_DATA: 0, playerDays: 0 },
    } satisfies TeamStatusResponse);
  }

  if (requestedTeamId && !trainerTeamIds.includes(requestedTeamId)) {
    return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });
  }

  const teamIds = requestedTeamId ? [requestedTeamId] : trainerTeamIds;

  const playerIds = await getTeamPlayerIds(teamIds);
  if (playerIds.length === 0) {
    return NextResponse.json({
      players: [],
      trend7d: { FIT: 0, MODIFIED_TRAINING: 0, REST: 0, NO_DATA: 0, playerDays: 0 },
    } satisfies TeamStatusResponse);
  }

  const admin = createAdminClient();

  // Coach-safe activity: Kabine open counts toward Soft-Pilot „Trainer ≥3×/Woche“.
  void admin
    .from('team_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('role', 'trainer')
    .in('team_id', teamIds);

  const { data: logs, error: logsError } = await admin
    .from('cycle_logs')
    .select('user_id, phase, energy_level, logged_at')
    .in('user_id', playerIds)
    .order('logged_at', { ascending: false });

  if (logsError) {
    console.error('Failed to fetch cycle logs for aggregation:', logsError);
    return NextResponse.json({ error: 'Failed to aggregate team status' }, { status: 500 });
  }

  const latestByUser = new Map<
    string,
    { phase: CyclePhase; energy_level: number | null; logged_at: string }
  >();
  for (const log of logs ?? []) {
    if (!latestByUser.has(log.user_id)) {
      latestByUser.set(log.user_id, {
        phase: log.phase as CyclePhase,
        energy_level: log.energy_level,
        logged_at: log.logged_at,
      });
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: summaries } = await admin
    .from('session_summaries')
    .select('user_id, load_score, started_at')
    .in('user_id', playerIds)
    .gte('started_at', sevenDaysAgo.toISOString());

  const loadByUser = new Map<string, number>();
  for (const row of summaries ?? []) {
    const prev = loadByUser.get(row.user_id) ?? 0;
    loadByUser.set(row.user_id, prev + (Number(row.load_score) || 0));
  }

  const loads = Array.from(loadByUser.values()).filter((v) => v > 0);
  const loadThreshold =
    loads.length > 0
      ? loads.sort((a, b) => a - b)[Math.floor(loads.length * 0.75)] ?? 0
      : 0;

  const result: TeamStatusEntry[] = [];

  for (const playerId of playerIds) {
    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(playerId);
    if (userError || !authUser.user) continue;

    const player = authUser.user;
    const log = latestByUser.get(playerId);
    const status = log
      ? mapCycleToStatus(log.phase, log.energy_level)
      : ('NO_DATA' as ReadinessStatus);

    const totalLoad = loadByUser.get(playerId);
    let loadFlag: LoadFlag = 'UNKNOWN';
    if (totalLoad !== undefined) {
      loadFlag = loadThreshold > 0 && totalLoad >= loadThreshold ? 'HIGH' : 'NORMAL';
    }

    const hoursSinceLog = log
      ? (Date.now() - new Date(log.logged_at).getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Stale logs (>48h) → NO_DATA via buildTrainerInsight
    const insight = buildTrainerInsight(status, loadFlag, hoursSinceLog);

    const name =
      (player.user_metadata?.full_name as string | undefined) ??
      player.email?.split('@')[0] ??
      'Spielerin';

    result.push({
      playerId,
      name,
      status: insight.status,
      loadFlag: insight.loadFlag,
      recommendation: insight.recommendation,
      loggedToday: log ? isSameBerlinDay(log.logged_at) : false,
      daysSinceLog: log ? berlinCalendarDaysBetween(log.logged_at) : null,
      invitePending: !player.last_sign_in_at,
    });
  }

  const rank: Record<ReadinessStatus, number> = {
    REST: 0,
    MODIFIED_TRAINING: 1,
    NO_DATA: 2,
    FIT: 3,
  };

  result.sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status];
    if (byStatus !== 0) return byStatus;
    if (a.loadFlag === 'HIGH' && b.loadFlag !== 'HIGH') return -1;
    if (b.loadFlag === 'HIGH' && a.loadFlag !== 'HIGH') return 1;
    return a.name.localeCompare(b.name, 'de');
  });

  const trend7d = computeReadinessTrend7d(playerIds, logs ?? []);

  const payload = assertCoachSafeTeamStatus({ players: result, trend7d });
  return NextResponse.json(payload);
}
