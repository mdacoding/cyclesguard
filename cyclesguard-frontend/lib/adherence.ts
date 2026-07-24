import { berlinDate } from '@/lib/date';

export interface AdherenceDayPoint {
  /** Berlin calendar day YYYY-MM-DD */
  day: string;
  /** Unique players who logged that day */
  logged: number;
  /** 0–100 */
  pct: number;
}

/**
 * Soft-Pilot scorecard series: last N Berlin days, pct of roster that logged.
 * Coach/admin safe — no health fields.
 */
export function buildAdherenceSeries(
  playerIds: string[],
  logs: { user_id: string; logged_at: string }[],
  windowDays = 7,
  today = new Date()
): AdherenceDayPoint[] {
  const roster = playerIds.length;
  const byDay = new Map<string, Set<string>>();

  for (const log of logs) {
    const day = berlinDate(log.logged_at);
    const set = byDay.get(day) ?? new Set<string>();
    set.add(log.user_id);
    byDay.set(day, set);
  }

  const series: AdherenceDayPoint[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const day = berlinDate(d);
    const loggedSet = byDay.get(day) ?? new Set();
    // Only count roster players
    let logged = 0;
    for (const id of playerIds) {
      if (loggedSet.has(id)) logged += 1;
    }
    series.push({
      day,
      logged,
      pct: roster === 0 ? 0 : Math.round((logged / roster) * 100),
    });
  }
  return series;
}

export const STREAK_GOAL_DAYS = 7;

export function streakGoalProgress(streak: number, goal = STREAK_GOAL_DAYS): {
  streak: number;
  goal: number;
  remaining: number;
  met: boolean;
} {
  const safe = Math.max(0, streak);
  return {
    streak: safe,
    goal,
    remaining: Math.max(0, goal - safe),
    met: safe >= goal,
  };
}
