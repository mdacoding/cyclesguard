import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWeeklyCallMarkdown,
  pilotWeekProgress,
  evaluateSoftPilotCriteria,
} from '@/lib/pilot-scorecard';

test('weekly call markdown is coach-safe and includes funnel', () => {
  const md = buildWeeklyCallMarkdown({
    clubOrScopeLabel: 'Eintracht Demo',
    when: new Date('2026-07-24T12:00:00+02:00'),
    players: 10,
    loggedToday: 7,
    logged7d: 8,
    adherencePct: 80,
    trainers: 2,
    trainersActive7d: 1,
    feedbackAvg: 4.2,
    feedbackTrainerAvg: 4.5,
    feedbackPlayerAvg: 4.0,
    pushOptIn: 6,
    consented: 9,
    teamsBelowTarget: 0,
    pilotStartsOn: '2026-07-01',
  });
  assert.match(md, /Adherence 7d/);
  assert.match(md, /80%/);
  assert.match(md, /Funnel/);
  assert.match(md, /Consent 9/);
  assert.match(md, /Push 6/);
  assert.match(md, /Soft-Pilot Fortschritt/);
  assert.match(md, /Woche /);
  assert.doesNotMatch(md, /menstru|zyklus|eisprung|symptom|phase/i);
});

test('pilotWeekProgress counts weeks from start', () => {
  const p = pilotWeekProgress('2026-07-01', new Date('2026-07-24T12:00:00+02:00'), 12);
  assert.ok(p);
  assert.equal(p!.week, 4);
  assert.equal(p!.totalWeeks, 12);
});

test('evaluateSoftPilotCriteria', () => {
  assert.equal(
    evaluateSoftPilotCriteria({ adherencePct: 80, trainersActive7d: 1, feedbackAvg: 4 }).allOk,
    true
  );
  assert.equal(
    evaluateSoftPilotCriteria({ adherencePct: 50, trainersActive7d: 1, feedbackAvg: 4 }).adherenceOk,
    false
  );
});
