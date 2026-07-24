/** Soft-Pilot weekly call clipboard — coach/admin safe, no Art.-9 fields. */

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

  return [
    `# CyclesGuard Soft-Pilot — Wochen-Call`,
    ``,
    `**Scope:** ${input.clubOrScopeLabel}`,
    `**Datum:** ${when.toLocaleDateString('de-DE')}`,
    ``,
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
