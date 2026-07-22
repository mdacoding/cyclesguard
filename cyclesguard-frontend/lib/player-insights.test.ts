import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLoggingStreak, computePlayerInsights } from '@/lib/player-insights';
import type { CycleLog } from '@/lib/types';

function log(partial: Partial<CycleLog> & { loggedAt: string; phase: CycleLog['phase'] }): CycleLog {
  return {
    id: partial.id ?? '1',
    userId: 'u1',
    symptoms: partial.symptoms ?? [],
    energyLevel: partial.energyLevel,
    notes: partial.notes,
    createdAt: partial.loggedAt,
    loggedAt: partial.loggedAt,
    phase: partial.phase,
  };
}

test('computeLoggingStreak counts consecutive Berlin days', () => {
  const today = new Date('2026-07-22T12:00:00+02:00');
  const logs = [
    log({ loggedAt: '2026-07-22T08:00:00+02:00', phase: 'follicular' }),
    log({ loggedAt: '2026-07-21T08:00:00+02:00', phase: 'follicular' }),
    log({ loggedAt: '2026-07-19T08:00:00+02:00', phase: 'menstrual' }),
  ];
  assert.equal(computeLoggingStreak(logs, today), 2);
});

test('computePlayerInsights averages energy by phase', () => {
  const logs = [
    log({ loggedAt: '2026-07-22T08:00:00+02:00', phase: 'luteal', energyLevel: 2 }),
    log({ loggedAt: '2026-07-21T08:00:00+02:00', phase: 'luteal', energyLevel: 4 }),
    log({
      loggedAt: '2026-07-20T08:00:00+02:00',
      phase: 'menstrual',
      energyLevel: 1,
      symptoms: ['cramps', 'fatigue'],
    }),
  ];
  const insights = computePlayerInsights(logs, 28);
  assert.equal(insights.loggedDays, 3);
  assert.equal(insights.avgEnergyByPhase.luteal, 3);
  assert.ok(insights.topSymptoms.some((s) => s.key === 'cramps'));
});
