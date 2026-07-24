import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCycleToStatus,
  buildTrainerInsight,
  getStatusLabel,
  getRecommendation,
} from '@/lib/trainer-status';
import { buildSessionStationsText } from '@/lib/kabine-pack';

test('trust preview copy stays coach-safe for menstrual low energy', () => {
  const status = mapCycleToStatus('menstrual', 1);
  const insight = buildTrainerInsight(status, 'UNKNOWN', 1);
  const blob = [getStatusLabel(insight.status), insight.recommendation, getRecommendation(status)].join(
    ' '
  );
  assert.equal(insight.status, 'REST');
  assert.doesNotMatch(blob, /menstru|zyklus|eisprung|ovulation|symptom|periode/i);
});

test('Einheitsblatt stations are coach-safe', () => {
  const text = buildSessionStationsText({
    teamName: 'Demo',
    sessionMode: true,
    when: new Date('2026-07-24T10:00:00+02:00'),
    members: [
      {
        name: 'Anna',
        status: 'REST',
        loadFlag: 'NORMAL',
        loggedToday: true,
        daysSinceLog: 0,
        recommendation: 'Regeneration empfohlen — Belastung deutlich reduzieren',
      },
      {
        name: 'Bella',
        status: 'FIT',
        loadFlag: 'HIGH',
        loggedToday: true,
        daysSinceLog: 0,
        recommendation: 'Volle Belastung möglich · Hohe Last (7 Tage) — Volumen prüfen',
      },
    ],
  });
  assert.match(text, /Einheitsblatt/);
  assert.match(text, /Station Regeneration/);
  assert.match(text, /Station Volllast/);
  assert.match(text, /Anna/);
  assert.doesNotMatch(text, /menstru|zyklus|eisprung|ovulation|phase|symptom/i);
});
