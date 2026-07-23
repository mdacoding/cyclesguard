import { CyclePhase } from './types';

export type ReadinessStatus = 'FIT' | 'MODIFIED_TRAINING' | 'REST' | 'NO_DATA';
export type LoadFlag = 'NORMAL' | 'HIGH' | 'UNKNOWN';

export const STALE_HOURS = 48;

/**
 * Maps cycle phase + energy level to a DOSB-compliant readiness signal.
 * No raw medical data leaves this function — only aggregated status codes.
 *
 * CTO rules:
 * - menstrual + energy 1–2 → REST
 * - menstrual + energy 3–5 → MODIFIED_TRAINING
 * - menstrual + energy null/undefined → MODIFIED_TRAINING (nicht REST raten)
 */
export function mapCycleToStatus(
  phase: CyclePhase,
  energyLevel?: number | null
): ReadinessStatus {
  switch (phase) {
    case 'follicular':
    case 'luteal':
      return 'FIT';
    case 'ovulation':
      return 'MODIFIED_TRAINING';
    case 'menstrual':
      if (typeof energyLevel === 'number' && energyLevel <= 2) return 'REST';
      return 'MODIFIED_TRAINING';
    default:
      return 'NO_DATA';
  }
}

export function getRecommendation(status: ReadinessStatus): string {
  switch (status) {
    case 'FIT':
      return 'Volle Belastung möglich';
    case 'MODIFIED_TRAINING':
      return 'Sprungkraft- und Plyometrietraining reduzieren';
    case 'REST':
      return 'Regeneration empfohlen — Belastung deutlich reduzieren';
    case 'NO_DATA':
      return 'Kein aktueller Status — Spielerin kontaktieren';
  }
}

/**
 * Stale logs (>48h) become NO_DATA so trainers don't act on outdated readiness.
 */
export function buildTrainerInsight(
  status: ReadinessStatus,
  loadFlag: LoadFlag,
  hoursSinceLog: number
): { status: ReadinessStatus; loadFlag: LoadFlag; recommendation: string; stale: boolean } {
  const stale = Number.isFinite(hoursSinceLog) && hoursSinceLog > STALE_HOURS;
  const effectiveStatus: ReadinessStatus =
    stale && status !== 'NO_DATA' ? 'NO_DATA' : status;

  const parts: string[] = [getRecommendation(effectiveStatus)];

  if (loadFlag === 'HIGH') {
    parts.push('Hohe Last (7 Tage) — Volumen prüfen');
  }

  if (stale) {
    parts.push('Status älter als 48h — Rückmeldung einholen');
  }

  return {
    status: effectiveStatus,
    loadFlag,
    recommendation: parts.join(' · '),
    stale,
  };
}

export function getStatusLabel(status: ReadinessStatus): string {
  switch (status) {
    case 'FIT':
      return 'Einsatzbereit';
    case 'MODIFIED_TRAINING':
      return 'Angepasstes Training';
    case 'REST':
      return 'Regeneration';
    case 'NO_DATA':
      return 'Keine Daten';
  }
}

export function getLoadLabel(flag: LoadFlag): string {
  switch (flag) {
    case 'HIGH':
      return 'Hohe Last';
    case 'NORMAL':
      return 'Normale Last';
    case 'UNKNOWN':
      return 'Keine Lastdaten';
  }
}

export function getStatusColor(status: ReadinessStatus): {
  bg: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'FIT':
      return { bg: 'bg-sage/10', border: 'border-sage/30', dot: 'bg-sage' };
    case 'MODIFIED_TRAINING':
      return { bg: 'bg-ovulation/10', border: 'border-ovulation/30', dot: 'bg-ovulation' };
    case 'REST':
      return { bg: 'bg-menstrual/10', border: 'border-menstrual/30', dot: 'bg-menstrual' };
    case 'NO_DATA':
      return { bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-cream/30' };
  }
}

/** Last N unique Berlin calendar days, newest first (includes today). */
export function lastBerlinDays(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  let t = from.getTime();
  while (out.length < n) {
    const day = new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    if (!out.includes(day)) out.push(day);
    t -= 60 * 60 * 1000;
  }
  return out;
}

export type ReadinessTrend7d = Record<ReadinessStatus, number> & { playerDays: number };

/**
 * Coach-safe 7d readiness histogram: one status per player per Berlin day.
 * Missing log that day → NO_DATA. No phases/symptoms exposed.
 */
export function computeReadinessTrend7d(
  playerIds: string[],
  logs: Array<{
    user_id: string;
    phase: CyclePhase | string;
    energy_level: number | null;
    logged_at: string;
  }>,
  days: string[] = lastBerlinDays(7)
): ReadinessTrend7d {
  const byUserDay = new Map<string, { phase: CyclePhase; energy: number | null }>();
  for (const log of logs) {
    const day = new Date(log.logged_at).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Berlin',
    });
    if (!days.includes(day)) continue;
    const key = `${log.user_id}|${day}`;
    if (byUserDay.has(key)) continue; // logs expected newest-first
    byUserDay.set(key, {
      phase: log.phase as CyclePhase,
      energy: log.energy_level,
    });
  }

  const counts: ReadinessTrend7d = {
    FIT: 0,
    MODIFIED_TRAINING: 0,
    REST: 0,
    NO_DATA: 0,
    playerDays: playerIds.length * days.length,
  };

  for (const playerId of playerIds) {
    for (const day of days) {
      const row = byUserDay.get(`${playerId}|${day}`);
      if (!row) {
        counts.NO_DATA += 1;
        continue;
      }
      counts[mapCycleToStatus(row.phase, row.energy)] += 1;
    }
  }

  return counts;
}
