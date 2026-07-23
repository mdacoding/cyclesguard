import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { berlinCalendarDaysBetween, berlinDate, isSameBerlinDay } from './date';

describe('berlin date helpers', () => {
  it('isSameBerlinDay matches identical calendar days', () => {
    const noon = `${berlinDate()}T12:00:00.000Z`;
    assert.equal(isSameBerlinDay(noon), true);
  });

  it('berlinCalendarDaysBetween counts whole days', () => {
    assert.equal(
      berlinCalendarDaysBetween('2026-07-20T12:00:00.000Z', '2026-07-23T12:00:00.000Z'),
      3
    );
    assert.equal(
      berlinCalendarDaysBetween('2026-07-23T10:00:00.000Z', '2026-07-23T18:00:00.000Z'),
      0
    );
  });
});
