/** Soft-Pilot weekly call clipboard — coach/admin safe, no Art.-9 fields. */

import { berlinDate } from '@/lib/date';

export interface WeeklyCallScorecardInput {
  clubOrScopeLabel: string;
  when?: Date;
  players: number;
  loggedToday: number;
  logged7d: number;
  adherencePct: number;
  trainers: number;
  trainersActive7d: number;
  feedbackAvg: number | null;
  feedbackTrainerAvg?: number | null;
  feedbackPlayerAvg?: number | null;
  pushOptIn: number;
  consented: number;
  teamsBelowTarget: number;
  /** Soft-Pilot season start YYYY-MM-DD (Berlin) */
  pilotStartsOn?: string | null;
  totalPilotWeeks?: number;
}

export interface PilotWeekProgress {
  week: number;
  totalWeeks: number;
  pctElapsed: number;
  label: string;
}

export function pilotWeekProgress(
  startsOn: string | null | undefined,
  today: Date = new Date(),
  totalWeeks = 12
): PilotWeekProgress | null {
  if (!startsOn || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) return null;
  const start = new Date(`${startsOn}T12:00:00+02:00`);
  const todayBerlin = berlinDate(today);
  const todayNoon = new Date(`${todayBerlin}T12:00:00+02:00`);
  const ms = todayNoon.getTime() - start.getTime();
  if (Number.isNaN(ms)) return null;
  const dayIndex = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (dayIndex < 0) {
    return { week: 0, totalWeeks, pctElapsed: 0, label: `Start ${startsOn}` };
  }
  const week = Math.min(totalWeeks, Math.floor(dayIndex / 7) + 1);
  const pctElapsed = Math.min(100, Math.round((week / totalWeeks) * 100));
  return {
    week,
    totalWeeks,
    pctElapsed,
    label: `Woche ${week}/${totalWeeks}`,
  };
}

export interface SoftPilotCriteria {
  adherenceOk: boolean;
  trainerOk: boolean;
  feedbackOk: boolean;
  privacyOk: boolean;
  allOk: boolean;
}

export function evaluateSoftPilotCriteria(input: {
  adherencePct: number;
  trainersActive7d: number;
  feedbackAvg: number | null;
}): SoftPilotCriteria {
  const adherenceOk = input.adherencePct >= 70;
  const trainerOk = input.trainersActive7d >= 1;
  const feedbackOk = input.feedbackAvg == null || input.feedbackAvg >= 4;
  const privacyOk = true;
  return {
    adherenceOk,
    trainerOk,
    feedbackOk,
    privacyOk,
    allOk: adherenceOk && trainerOk && feedbackOk && privacyOk,
  };
}

export function buildWeeklyCallMarkdown(input: WeeklyCallScorecardInput): string {
  const when = input.when ?? new Date();
  const noDataTodayPct =
    input.players === 0
      ? '—'
      : `${Math.round(((input.players - input.loggedToday) / input.players) * 100)}%`;
  const pushPct =
    input.players === 0 ? '—' : `${Math.round((input.pushOptIn / input.players) * 100)}%`;
  const consentPct =
    input.players === 0 ? '—' : `${Math.round((input.consented / input.players) * 100)}%`;
  const fb =
    input.feedbackAvg != null
      ? `${input.feedbackAvg}/5 (T ${input.feedbackTrainerAvg ?? '—'} · S ${input.feedbackPlayerAvg ?? '—'})`
      : '—';

  const progress = pilotWeekProgress(input.pilotStartsOn, when, input.totalPilotWeeks ?? 12);
  const criteria = evaluateSoftPilotCriteria({
    adherencePct: input.adherencePct,
    trainersActive7d: input.trainersActive7d,
    feedbackAvg: input.feedbackAvg,
  });

  const progressBlock = progress
    ? [
        `## Soft-Pilot Fortschritt`,
        ``,
        `${progress.label} (${progress.pctElapsed}% der ${progress.totalWeeks} Wochen)`,
        `Kriterien: Adherence ${criteria.adherenceOk ? 'OK' : 'offen'} · Trainer Kabine ${criteria.trainerOk ? 'OK' : 'offen'} · Feedback ${criteria.feedbackOk ? 'OK' : 'offen'} · Privacy ${criteria.privacyOk ? 'OK' : 'offen'}`,
        criteria.allOk ? `→ Ready for Paid? Closing-Checkliste prüfen.` : `→ Soft-Pilot weiterfahren.`,
        ``,
      ]
    : [];

  return [
    `# CyclesGuard Soft-Pilot — Wochen-Call`,
    ``,
    `**Scope:** ${input.clubOrScopeLabel}`,
    `**Datum:** ${when.toLocaleDateString('de-DE')}`,
    ``,
    ...progressBlock,
    `## Scorecard`,
    ``,
    `| Metrik | Ist | Ziel |`,
    `|--------|-----|------|`,
    `| Adherence 7d | ${input.adherencePct}% (${input.logged7d}/${input.players}) | ≥70% |`,
    `| Keine Daten heute | ${noDataTodayPct} (${input.players - input.loggedToday}/${input.players}) | sinkend |`,
    `| Trainer aktiv 7d | ${input.trainers === 0 ? '—' : `${input.trainersActive7d}/${input.trainers}`} | ≥1 aktiv / Kabine ≥3× |`,
    `| Push Opt-in | ${pushPct} (${input.pushOptIn}/${input.players}) | steigend |`,
    `| Consent | ${consentPct} (${input.consented}/${input.players}) | 100% aktive |`,
    `| Feedback Ø | ${fb} | ≥4 |`,
    `| Teams unter 70% | ${input.teamsBelowTarget} | 0 |`,
    ``,
    `## Funnel (coach-safe)`,
    ``,
    `Eingeladen ${input.players} → Consent ${input.consented} → Log 7d ${input.logged7d} → Push ${input.pushOptIn}`,
    ``,
    `## Notizen`,
    ``,
    `**Was lief gut:**`,
    ``,
    `**Was blockiert:**`,
    ``,
    `**Entscheidung nächste Woche:**`,
    ``,
  ].join('\n');
}
