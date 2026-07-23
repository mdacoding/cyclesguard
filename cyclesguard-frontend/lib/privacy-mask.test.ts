import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainerInsight, getRecommendation, getStatusLabel } from './trainer-status';

const FORBIDDEN = /menstru|zyklus|eisprung|ovulation|symptom|krämpfe|periode/i;

describe('trainer-facing copy never leaks medical terms', () => {
  it('status labels are coach-safe', () => {
    for (const status of ['FIT', 'MODIFIED_TRAINING', 'REST', 'NO_DATA'] as const) {
      assert.doesNotMatch(getStatusLabel(status), FORBIDDEN);
      assert.doesNotMatch(getRecommendation(status), FORBIDDEN);
    }
  });

  it('combined insights stay coach-safe', () => {
    const insight = buildTrainerInsight('REST', 'HIGH', 2);
    assert.doesNotMatch(insight.recommendation, FORBIDDEN);
    assert.equal(insight.status, 'REST');
  });
});

describe('team-status response contract (shape)', () => {
  it('documents allowed keys for trainer clients', () => {
    const allowed = new Set([
      'playerId',
      'name',
      'status',
      'loadFlag',
      'recommendation',
      'loggedToday',
      'invitePending',
    ]);
    const sample = {
      playerId: 'x',
      name: 'Anna',
      status: 'FIT',
      loadFlag: 'UNKNOWN',
      recommendation: 'Volle Belastung möglich',
      loggedToday: true,
      invitePending: false,
    };
    for (const key of Object.keys(sample)) {
      assert.ok(allowed.has(key), `unexpected key ${key}`);
    }
    assert.equal('phase' in sample, false);
    assert.equal('symptoms' in sample, false);
  });
});
