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
