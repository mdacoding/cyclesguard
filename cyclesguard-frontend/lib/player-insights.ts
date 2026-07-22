import { CycleLog, CyclePhase } from '@/lib/types';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import { SYMPTOM_OPTIONS } from '@/lib/symptoms';
import { berlinDate } from '@/lib/date';

export interface PlayerInsights {
  loggedDays: number;
  windowDays: number;
  streak: number;
  avgEnergyByPhase: Partial<Record<CyclePhase, number>>;
  topSymptoms: { key: string; label: string; count: number }[];
  phaseSequence: CyclePhase[];
}

function symptomLabel(key: string): string {
  return SYMPTOM_OPTIONS.find((s) => s.key === key)?.labelDE ?? key;
}

/** Current consecutive Berlin days with a log, counting back from today. */
export function computeLoggingStreak(logs: CycleLog[], today = new Date()): number {
  const days = new Set(logs.map((l) => berlinDate(l.loggedAt)));
  let streak = 0;
  const cursor = new Date(today);
  for (;;) {
    const key = berlinDate(cursor);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computePlayerInsights(logs: CycleLog[], windowDays = 28): PlayerInsights {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - (windowDays - 1));
  const windowStartKey = berlinDate(windowStart);

  const inWindow = logs.filter((l) => berlinDate(l.loggedAt) >= windowStartKey);
  const byDay = new Map<string, CycleLog>();
  for (const log of inWindow) {
    const key = berlinDate(log.loggedAt);
    if (!byDay.has(key)) byDay.set(key, log);
  }

  const energySums: Partial<Record<CyclePhase, { sum: number; n: number }>> = {};
  const symptomCounts = new Map<string, number>();
  const phaseSequence: CyclePhase[] = [];

  const dayKeys: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dayKeys.push(berlinDate(d));
  }

  for (const day of dayKeys) {
    const log = byDay.get(day);
    if (!log) continue;
    phaseSequence.push(log.phase);
    if (typeof log.energyLevel === 'number') {
      const bucket = energySums[log.phase] ?? { sum: 0, n: 0 };
      bucket.sum += log.energyLevel;
      bucket.n += 1;
      energySums[log.phase] = bucket;
    }
    for (const s of log.symptoms) {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
    }
  }

  const avgEnergyByPhase: Partial<Record<CyclePhase, number>> = {};
  for (const phase of Object.keys(PHASE_DEFINITIONS) as CyclePhase[]) {
    const bucket = energySums[phase];
    if (bucket && bucket.n > 0) {
      avgEnergyByPhase[phase] = Math.round((bucket.sum / bucket.n) * 10) / 10;
    }
  }

  const topSymptoms = Array.from(symptomCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({ key, label: symptomLabel(key), count }));

  return {
    loggedDays: byDay.size,
    windowDays,
    streak: computeLoggingStreak(logs, now),
    avgEnergyByPhase,
    topSymptoms,
    phaseSequence,
  };
}
