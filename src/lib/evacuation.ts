/**
 * Pure evacuation headcount logic helper functions
 * extracted for testability and route sharing.
 */

export interface EvacuationParticipant {
  id: number;
  full_name: string;
  pass_number: string;
  phone?: string | null;
  organisation?: string | null;
  host_name?: string | null;
  host_department?: string | null;
  visit_purpose?: string | null;
  visitor_type?: string | null;
  vehicle_registration?: string | null;
  location?: string | null;
  check_in_date?: string | Date | null;
  check_in_status?: string | null;
}

export interface EvacuationStaff {
  id: number;
  name: string;
  role: string;
  shift: string;
  email?: string | null;
}

export function isGuestHouseResident(visitorType?: string | null): boolean {
  if (!visitorType) return false;
  const normalized = visitorType.trim().toLowerCase();
  return ['guest house', 'guesthouse', 'guest_house', 'resident'].includes(normalized);
}

export function determineGhanaShift(date: Date = new Date()): 'day' | 'night' {
  // Ghana is strictly UTC with no Daylight Saving Time
  const ghanaHour = date.getUTCHours();
  return ghanaHour >= 6 && ghanaHour < 18 ? 'day' : 'night';
}

export function groupEvacuationHeadcount(
  participants: EvacuationParticipant[],
  staff: EvacuationStaff[],
  shiftDate: Date = new Date()
) {
  const activeOnly = participants.filter((p) => p.check_in_status === 'CHECKED_IN');
  const visitors: EvacuationParticipant[] = [];
  const guestHouseResidents: EvacuationParticipant[] = [];

  for (const p of activeOnly) {
    if (isGuestHouseResident(p.visitor_type)) {
      guestHouseResidents.push(p);
    } else {
      visitors.push(p);
    }
  }

  const currentShift = determineGhanaShift(shiftDate);
  const onDutyStaff = staff.filter((s) => s.shift?.toLowerCase() === currentShift);

  const totalHeadcount = visitors.length + guestHouseResidents.length + onDutyStaff.length;

  return {
    currentShift,
    totalHeadcount,
    visitors,
    guestHouseResidents,
    onDutyStaff,
    counts: {
      visitors: visitors.length,
      guestHouse: guestHouseResidents.length,
      onDutyStaff: onDutyStaff.length,
    },
  };
}
