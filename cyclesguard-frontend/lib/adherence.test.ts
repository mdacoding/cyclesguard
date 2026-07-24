import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdherenceSeries,
  streakGoalProgress,
  STREAK_GOAL_DAYS,
} from '@/lib/adherence';

test('buildAdherenceSeries counts roster-only logs per Berlin day', () => {
  const today = new Date('2026-07-24T12:00:00+02:00');
  const players = ['p1', 'p2'];
  const logs = [
    { user_id: 'p1', logged_at: '2026-07-24T08:00:00.000Z' },
    { user_id: 'p1', logged_at: '2026-07-24T09:00:00.000Z' }, // same day, once
    { user_id: 'p2', logged_at: '2026-07-23T10:00:00.000Z' },
    { user_id: 'outsider', logged_at: '2026-07-24T11:00:00.000Z' },
  ];
  const series = buildAdherenceSeries(players, logs, 3, today);
  assert.equal(series.length, 3);
  assert.equal(series[2].day, '2026-07-24');
  assert.equal(series[2].logged, 1);
  assert.equal(series[2].pct, 50);
  assert.equal(series[1].logged, 1);
  assert.equal(series[1].pct, 50);
  assert.equal(series[0].logged, 0);
  assert.equal(series[0].pct, 0);
});

test('buildAdherenceSeries empty roster is 0%', () => {
  const series = buildAdherenceSeries([], [{ user_id: 'x', logged_at: '2026-07-24T08:00:00.000Z' }], 2);
  assert.equal(series.every((p) => p.pct === 0 && p.logged === 0), true);
});

test('streakGoalProgress', () => {
  assert.deepEqual(streakGoalProgress(0), {
    streak: 0,
    goal: STREAK_GOAL_DAYS,
    remaining: STREAK_GOAL_DAYS,
    met: false,
  });
  assert.deepEqual(streakGoalProgress(3), {
    streak: 3,
    goal: 7,
    remaining: 4,
    met: false,
  });
  assert.equal(streakGoalProgress(7).met, true);
  assert.equal(streakGoalProgress(10).remaining, 0);
});
