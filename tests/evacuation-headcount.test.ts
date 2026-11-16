import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGuestHouseResident,
  determineGhanaShift,
  groupEvacuationHeadcount,
  EvacuationParticipant,
  EvacuationStaff,
} from '../src/lib/evacuation';

test('Phase 2 - Task 9: Evacuation Headcount Grouping & Roll Call', async (t) => {
  await t.test('isGuestHouseResident identifies guest house occupants', () => {
    assert.equal(isGuestHouseResident('Guest House'), true);
    assert.equal(isGuestHouseResident('guesthouse'), true);
    assert.equal(isGuestHouseResident('guest_house'), true);
    assert.equal(isGuestHouseResident('Resident'), true);
    assert.equal(isGuestHouseResident('Official'), false);
    assert.equal(isGuestHouseResident('Contractor'), false);
    assert.equal(isGuestHouseResident(null), false);
    assert.equal(isGuestHouseResident(''), false);
  });

  await t.test('determineGhanaShift computes accurate day/night shift', () => {
    // 08:30 UTC -> Day
    const morning = new Date('2026-05-10T08:30:00Z');
    assert.equal(determineGhanaShift(morning), 'day');

    // 14:00 UTC -> Day
    const afternoon = new Date('2026-05-10T14:00:00Z');
    assert.equal(determineGhanaShift(afternoon), 'day');

    // 20:00 UTC -> Night
    const evening = new Date('2026-05-10T20:00:00Z');
    assert.equal(determineGhanaShift(evening), 'night');

    // 03:00 UTC -> Night
    const lateNight = new Date('2026-05-10T03:00:00Z');
    assert.equal(determineGhanaShift(lateNight), 'night');
  });

  await t.test('groupEvacuationHeadcount cleanly divides visitors, guest house, and on-duty staff', () => {
    const participants: EvacuationParticipant[] = [
      {
        id: 1,
        full_name: 'Visitor One',
        pass_number: 'PCC-V001',
        visitor_type: 'Official',
        check_in_status: 'CHECKED_IN',
      },
      {
        id: 2,
        full_name: 'Resident Two',
        pass_number: 'PCC-V002',
        visitor_type: 'Guest House',
        check_in_status: 'CHECKED_IN',
      },
      {
        id: 3,
        full_name: 'Departed Visitor',
        pass_number: 'PCC-V003',
        visitor_type: 'Official',
        check_in_status: 'CHECKED_OUT', // Not active
      },
      {
        id: 4,
        full_name: 'Resident Three',
        pass_number: 'PCC-V004',
        visitor_type: 'Resident',
        check_in_status: 'CHECKED_IN',
      },
    ];

    const staff: EvacuationStaff[] = [
      { id: 10, name: 'Officer Kwame', role: 'security_officer', shift: 'day' },
      { id: 11, name: 'Supervisor Mensah', role: 'supervisor', shift: 'day' },
      { id: 12, name: 'Officer Kofi', role: 'security_officer', shift: 'night' },
    ];

    const dayTime = new Date('2026-05-10T10:00:00Z');
    const result = groupEvacuationHeadcount(participants, staff, dayTime);

    assert.equal(result.currentShift, 'day');
    assert.equal(result.visitors.length, 1);
    assert.equal(result.visitors[0].full_name, 'Visitor One');
    assert.equal(result.guestHouseResidents.length, 2);
    assert.equal(result.onDutyStaff.length, 2);
    assert.equal(result.totalHeadcount, 5); // 1 visitor + 2 guest house + 2 day staff
    assert.deepEqual(result.counts, {
      visitors: 1,
      guestHouse: 2,
      onDutyStaff: 2,
    });
  });
});
