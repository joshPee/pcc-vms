import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAccraDateTime,
  getAccraDateString,
  getAccraDayBounds,
  isTodayInAccra,
  ACCRA_TIMEZONE,
} from '../src/lib/accra-timezone';

test('Phase 2 - Task 12: Africa/Accra Timezone Correctness', async (t) => {
  await t.test('enforces Africa/Accra timezone name', () => {
    assert.equal(ACCRA_TIMEZONE, 'Africa/Accra');
  });

  await t.test('formats timestamp strictly in Accra time', () => {
    // 2026-06-15 14:30:45 UTC
    const date = new Date('2026-06-15T14:30:45Z');
    const formatted = formatAccraDateTime(date);
    // en-GB format is DD/MM/YYYY, HH:MM:SS
    assert.equal(formatted, '15/06/2026, 14:30:45');
  });

  await t.test('getAccraDateString extracts canonical YYYY-MM-DD for Accra', () => {
    // 23:30 UTC on Dec 31
    const newYearsEve = new Date('2026-12-31T23:30:00Z');
    assert.equal(getAccraDateString(newYearsEve), '2026-12-31');

    // 00:15 UTC on Jan 1
    const newYear = new Date('2027-01-01T00:15:00Z');
    assert.equal(getAccraDateString(newYear), '2027-01-01');
  });

  await t.test('getAccraDayBounds computes exact 00:00:00 to 23:59:59.999 UTC window', () => {
    const reference = new Date('2026-07-20T12:00:00Z');
    const { startOfDay, endOfDay } = getAccraDayBounds(reference);

    assert.equal(startOfDay.toISOString(), '2026-07-20T00:00:00.000Z');
    assert.equal(endOfDay.toISOString(), '2026-07-20T23:59:59.999Z');
  });

  await t.test('isTodayInAccra accurately evaluates timestamps against Accra calendar day', () => {
    const now = new Date('2026-08-10T15:00:00Z');
    const earlierToday = new Date('2026-08-10T02:00:00Z');
    const yesterday = new Date('2026-08-09T23:59:00Z');

    assert.equal(isTodayInAccra(earlierToday, now), true);
    assert.equal(isTodayInAccra(yesterday, now), false);
  });
});
