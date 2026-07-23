import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCycleToStatus,
  getRecommendation,
  buildTrainerInsight,
  computeReadinessTrend7d,
} from './trainer-status';

describe('mapCycleToStatus', () => {
  it('maps follicular and luteal to FIT', () => {
    assert.equal(mapCycleToStatus('follicular'), 'FIT');
    assert.equal(mapCycleToStatus('luteal'), 'FIT');
  });

  it('maps ovulation to MODIFIED_TRAINING', () => {
    assert.equal(mapCycleToStatus('ovulation'), 'MODIFIED_TRAINING');
  });

  it('maps menstrual with low energy to REST', () => {
    assert.equal(mapCycleToStatus('menstrual', 1), 'REST');
    assert.equal(mapCycleToStatus('menstrual', 2), 'REST');
  });

  it('maps menstrual with missing energy to MODIFIED_TRAINING (not REST)', () => {
    assert.equal(mapCycleToStatus('menstrual', null), 'MODIFIED_TRAINING');
    assert.equal(mapCycleToStatus('menstrual', undefined), 'MODIFIED_TRAINING');
  });

  it('maps menstrual with higher energy to MODIFIED_TRAINING', () => {
    assert.equal(mapCycleToStatus('menstrual', 3), 'MODIFIED_TRAINING');
    assert.equal(mapCycleToStatus('menstrual', 5), 'MODIFIED_TRAINING');
  });
});

describe('getRecommendation', () => {
  it('never exposes medical terminology', () => {
    const texts = [
      getRecommendation('FIT'),
      getRecommendation('MODIFIED_TRAINING'),
      getRecommendation('REST'),
      getRecommendation('NO_DATA'),
    ];
    for (const text of texts) {
      assert.doesNotMatch(text, /menstru|zyklus|eisprung|ovulation/i);
    }
  });
});

describe('buildTrainerInsight', () => {
  it('marks stale logs as NO_DATA', () => {
    const insight = buildTrainerInsight('FIT', 'NORMAL', 72);
    assert.equal(insight.status, 'NO_DATA');
    assert.equal(insight.stale, true);
    assert.match(insight.recommendation, /48h/);
  });

  it('keeps fresh status and adds load hint', () => {
    const insight = buildTrainerInsight('MODIFIED_TRAINING', 'HIGH', 6);
    assert.equal(insight.status, 'MODIFIED_TRAINING');
    assert.equal(insight.stale, false);
    assert.match(insight.recommendation, /Hohe Last/);
    assert.doesNotMatch(insight.recommendation, /menstru|zyklus|eisprung/i);
  });
});

describe('computeReadinessTrend7d', () => {
  it('counts player-days and missing logs as NO_DATA', () => {
    const days = [
      '2026-07-23',
      '2026-07-22',
      '2026-07-21',
      '2026-07-20',
      '2026-07-19',
      '2026-07-18',
      '2026-07-17',
    ];
    const trend = computeReadinessTrend7d(
      ['p1', 'p2'],
      [
        {
          user_id: 'p1',
          phase: 'follicular',
          energy_level: 4,
          logged_at: '2026-07-23T10:00:00.000Z',
        },
        {
          user_id: 'p1',
          phase: 'menstrual',
          energy_level: 1,
          logged_at: '2026-07-22T10:00:00.000Z',
        },
      ],
      days
    );
    assert.equal(trend.playerDays, 14);
    assert.equal(trend.FIT, 1);
    assert.equal(trend.REST, 1);
    assert.equal(trend.NO_DATA, 12);
  });
});
