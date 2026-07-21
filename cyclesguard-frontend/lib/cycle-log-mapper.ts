import { CycleLog, CyclePhase } from './types';

/** Normalizes Supabase snake_case rows into the app CycleLog model. */
export function mapDbCycleLog(row: Record<string, unknown>): CycleLog {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ''),
    loggedAt: String(row.logged_at ?? row.loggedAt ?? ''),
    phase: row.phase as CyclePhase,
    symptoms: Array.isArray(row.symptoms) ? (row.symptoms as string[]) : [],
    notes: (row.notes as string | undefined) ?? undefined,
    energyLevel:
      typeof row.energy_level === 'number'
        ? row.energy_level
        : typeof row.energyLevel === 'number'
          ? row.energyLevel
          : undefined,
    createdAt: String(row.created_at ?? row.createdAt ?? row.logged_at ?? ''),
  };
}
