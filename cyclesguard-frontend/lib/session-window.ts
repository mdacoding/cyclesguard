import { berlinDate } from '@/lib/date';

export interface TeamSessionWindow {
  /** HH:MM 24h Berlin wall clock */
  time: string;
  /** Berlin calendar day YYYY-MM-DD */
  date: string;
}

export const SESSION_WINDOW_PREFIX = 'cg_team_session_';
export const SESSION_PRE_WINDOW_MINUTES = 90;

export function sessionWindowStorageKey(teamId: string): string {
  return `${SESSION_WINDOW_PREFIX}${teamId}`;
}

export function parseSessionTime(time: string): { hours: number; minutes: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

/** Minutes from `now` until session start on Berlin calendar day (negative = past). */
export function minutesUntilSession(
  window: TeamSessionWindow,
  now: Date = new Date()
): number | null {
  const parsed = parseSessionTime(window.time);
  if (!parsed) return null;
  const todayBerlin = berlinDate(now);
  if (window.date !== todayBerlin) {
    // Only cue for today’s unit
    return null;
  }

  const berlinParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    Number(berlinParts.find((p) => p.type === type)?.value ?? NaN);
  const nowMin = get('hour') * 60 + get('minute');
  const sessionMin = parsed.hours * 60 + parsed.minutes;
  return sessionMin - nowMin;
}

export function isWithinPreSessionWindow(
  window: TeamSessionWindow,
  now: Date = new Date(),
  withinMinutes = SESSION_PRE_WINDOW_MINUTES
): boolean {
  const mins = minutesUntilSession(window, now);
  if (mins == null) return false;
  return mins >= 0 && mins <= withinMinutes;
}

export function readTeamSessionWindow(teamId: string): TeamSessionWindow | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(sessionWindowStorageKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TeamSessionWindow;
    if (!parsed?.time || !parsed?.date || !parseSessionTime(parsed.time)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTeamSessionWindow(teamId: string, window: TeamSessionWindow): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(sessionWindowStorageKey(teamId), JSON.stringify(window));
  } catch {
    /* ignore */
  }
}

export function clearTeamSessionWindow(teamId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(sessionWindowStorageKey(teamId));
  } catch {
    /* ignore */
  }
}
