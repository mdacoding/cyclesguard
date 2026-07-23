import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripHealthFieldsFromRecord, stripSentryEventHealth } from './sentry-strip';

describe('sentry-strip', () => {
  it('removes Art.-9 fields from records', () => {
    const safe = stripHealthFieldsFromRecord({
      phase: 'menstrual',
      symptoms: ['cramps'],
      energy_level: 2,
      notes: 'secret',
      playerId: 'x',
      status: 'REST',
    });
    assert.deepEqual(safe, { playerId: 'x', status: 'REST' });
  });

  it('strips request.data and breadcrumb health keys', () => {
    const event = stripSentryEventHealth({
      request: { data: { phase: 'luteal', foo: 1 } },
      breadcrumbs: [
        { data: { phase: 'ovulation', symptoms: ['x'], teamId: 't1' } },
        { data: { status: 'FIT' } },
      ],
    });
    assert.equal(event.request?.data, undefined);
    assert.deepEqual(event.breadcrumbs?.[0]?.data, { teamId: 't1' });
    assert.deepEqual(event.breadcrumbs?.[1]?.data, { status: 'FIT' });
  });
});
