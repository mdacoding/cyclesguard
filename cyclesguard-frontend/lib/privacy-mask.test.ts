import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainerInsight, getRecommendation, getStatusLabel } from './trainer-status';
import {
  assertCoachSafeTeamStatus,
  TEAM_STATUS_ENTRY_KEYS,
  TeamStatusEntrySchema,
} from './trainer-status-contract';

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

describe('team-status response contract (runtime allowlist)', () => {
  it('documents allowed keys for trainer clients', () => {
    const sample = {
      playerId: 'x',
      name: 'Anna',
      status: 'FIT' as const,
      loadFlag: 'UNKNOWN' as const,
      recommendation: 'Volle Belastung möglich',
      loggedToday: true,
      daysSinceLog: 0,
      invitePending: false,
      hasPush: true,
    };
    const parsed = TeamStatusEntrySchema.parse(sample);
    assert.deepEqual(Object.keys(parsed).sort(), [...TEAM_STATUS_ENTRY_KEYS].sort());
  });

  it('rejects Art.-9 keys via .strict()', () => {
    assert.throws(() =>
      TeamStatusEntrySchema.parse({
        playerId: 'x',
        name: 'Anna',
        status: 'FIT',
        loadFlag: 'NORMAL',
        recommendation: 'ok',
        loggedToday: false,
        daysSinceLog: null,
        invitePending: false,
        hasPush: false,
        phase: 'menstrual',
      })
    );
  });

  it('assertCoachSafeTeamStatus accepts valid payload', () => {
    const safe = assertCoachSafeTeamStatus({
      players: [
        {
          playerId: 'p1',
          name: 'Anna',
          status: 'FIT',
          loadFlag: 'NORMAL',
          recommendation: 'Volle Belastung möglich',
          loggedToday: true,
          daysSinceLog: 0,
          invitePending: false,
          hasPush: true,
        },
      ],
      trend7d: {
        FIT: 1,
        MODIFIED_TRAINING: 0,
        REST: 0,
        NO_DATA: 0,
        playerDays: 1,
      },
    });
    assert.equal(safe.players.length, 1);
  });
});
