import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAccraMidnightCutoff,
  isEligibleForAutoCheckout,
  filterEligibleForReconciliation,
  VisitorRecord,
} from '../src/lib/reconciliation';

test('Phase 2 - Task 8: Nightly Reconciliation of Forgotten Checkouts', async (t) => {
  const cutoff = new Date('2026-11-15T00:00:00.000Z');

  await t.test('getAccraMidnightCutoff returns 00:00:00 UTC cutoff for Ghana timezone', () => {
    const ref = new Date('2026-11-15T16:30:00.000Z');
    const result = getAccraMidnightCutoff(ref);
    assert.equal(result.getUTCHours(), 0);
    assert.equal(result.getUTCMinutes(), 0);
    assert.equal(result.getUTCSeconds(), 0);
    assert.equal(result.toISOString(), '2026-11-15T00:00:00.000Z');
  });

  await t.test('isEligibleForAutoCheckout marks single-day visitors checked in before cutoff as eligible', () => {
    const lingeringVisitor: VisitorRecord = {
      id: 101,
      fullName: 'Kwame Osei',
      checkInStatus: 'CHECKED_IN',
      checkInDate: '2026-11-14T14:30:00.000Z', // Yesterday
      visitorType: 'Official',
      isRecurring: false,
    };

    assert.equal(isEligibleForAutoCheckout(lingeringVisitor, cutoff), true);
  });

  await t.test('isEligibleForAutoCheckout leaves visitors checked in today untouched', () => {
    const todayVisitor: VisitorRecord = {
      id: 102,
      fullName: 'Abena Frimpong',
      checkInStatus: 'CHECKED_IN',
      checkInDate: '2026-11-15T08:15:00.000Z', // Today after midnight cutoff
      visitorType: 'Official',
      isRecurring: false,
    };

    assert.equal(isEligibleForAutoCheckout(todayVisitor, cutoff), false);
  });

  await t.test('isEligibleForAutoCheckout ignores visitors who already checked out or never checked in', () => {
    const checkedOut: VisitorRecord = {
      id: 103,
      fullName: 'Kofi Mensah',
      checkInStatus: 'CHECKED_OUT',
      checkInDate: '2026-11-14T10:00:00.000Z',
    };
    const notCheckedIn: VisitorRecord = {
      id: 104,
      fullName: 'Esi Boateng',
      checkInStatus: 'NOT_CHECKED_IN',
      checkInDate: '2026-11-14T10:00:00.000Z',
    };

    assert.equal(isEligibleForAutoCheckout(checkedOut, cutoff), false);
    assert.equal(isEligibleForAutoCheckout(notCheckedIn, cutoff), false);
  });

  await t.test('isEligibleForAutoCheckout exempts Guest House residents and multi-day conference attendees', () => {
    const guestHouseResident: VisitorRecord = {
      id: 105,
      fullName: 'Dr. Joseph Adjei',
      checkInStatus: 'CHECKED_IN',
      checkInDate: '2026-11-13T16:00:00.000Z',
      visitorType: 'Guest House Resident',
      isRecurring: false,
    };

    const multiDayVisitor: VisitorRecord = {
      id: 106,
      fullName: 'Sarah Johnson',
      checkInStatus: 'CHECKED_IN',
      checkInDate: '2026-11-13T16:00:00.000Z',
      visitorType: 'Official',
      isRecurring: true, // Marked multi-day / recurring
    };

    const futureDepartureVisitor: VisitorRecord = {
      id: 107,
      fullName: 'Michael Owusu',
      checkInStatus: 'CHECKED_IN',
      checkInDate: '2026-11-13T16:00:00.000Z',
      visitorType: 'Official',
      isRecurring: false,
      expectedDepartureDate: '2026-11-18T18:00:00.000Z', // Future departure
    };

    assert.equal(isEligibleForAutoCheckout(guestHouseResident, cutoff), false);
    assert.equal(isEligibleForAutoCheckout(multiDayVisitor, cutoff), false);
    assert.equal(isEligibleForAutoCheckout(futureDepartureVisitor, cutoff), false);
  });

  await t.test('filterEligibleForReconciliation accurately selects only lingering single-day visitors', () => {
    const list: VisitorRecord[] = [
      { id: 1, checkInStatus: 'CHECKED_IN', checkInDate: '2026-11-14T09:00:00Z', isRecurring: false }, // Eligible
      { id: 2, checkInStatus: 'CHECKED_IN', checkInDate: '2026-11-15T09:00:00Z', isRecurring: false }, // Today -> Excluded
      { id: 3, checkInStatus: 'CHECKED_IN', checkInDate: '2026-11-13T09:00:00Z', visitorType: 'Guest House' }, // Resident -> Excluded
      { id: 4, checkInStatus: 'CHECKED_IN', checkInDate: '2026-11-12T09:00:00Z', isRecurring: true }, // Recurring -> Excluded
      { id: 5, checkInStatus: 'CHECKED_IN', checkInDate: '2026-11-14T18:00:00Z', isRecurring: false }, // Eligible
    ];

    const eligible = filterEligibleForReconciliation(list, cutoff);
    assert.equal(eligible.length, 2);
    assert.deepEqual(eligible.map((e) => e.id), [1, 5]);
  });
});
