/**
 * Nightly Reconciliation Logic for Forgotten Checkouts
 * Timezone: Africa/Accra (UTC+0, Ghana does not observe DST)
 */

export interface VisitorRecord {
  id: number;
  fullName?: string;
  checkInStatus: string;
  checkInDate: string | Date;
  isRecurring?: boolean;
  expectedDepartureDate?: string | Date | null;
  visitorType?: string | null;
}

export const EXEMPT_VISITOR_TYPES = [
  'guest house',
  'guest house resident',
  'resident',
  'multi-day',
  'multi-day conference',
  'contractor',
];

/**
 * Returns the midnight cutoff (00:00:00) for a given date in Africa/Accra timezone.
 * Visitors checked in before this cutoff on single-day visits should be auto-checked-out.
 */
export function getAccraMidnightCutoff(referenceDate: Date = new Date()): Date {
  // Ghana is UTC/GMT year-round (no daylight saving time)
  const cutoff = new Date(referenceDate);
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff;
}

/**
 * Determines whether a visitor still marked CHECKED_IN is eligible for nightly auto-checkout.
 * Single-day visitors checked in before the cutoff are eligible.
 * Multi-day and guest house residents are explicitly exempt.
 */
export function isEligibleForAutoCheckout(
  visitor: VisitorRecord,
  cutoffTime: Date = getAccraMidnightCutoff()
): boolean {
  if (visitor.checkInStatus !== 'CHECKED_IN') {
    return false;
  }

  // Multi-day / recurring flags
  if (visitor.isRecurring === true) {
    return false;
  }

  // Exempt visitor types (e.g. Guest House residents)
  if (visitor.visitorType) {
    const normalizedType = visitor.visitorType.toLowerCase().trim();
    if (EXEMPT_VISITOR_TYPES.some((exempt) => normalizedType.includes(exempt))) {
      return false;
    }
  }

  // If visitor has future expected departure date
  if (visitor.expectedDepartureDate) {
    const departure = new Date(visitor.expectedDepartureDate);
    if (!isNaN(departure.getTime()) && departure > cutoffTime) {
      return false;
    }
  }

  // Check check-in timestamp against cutoff
  const checkIn = new Date(visitor.checkInDate);
  if (isNaN(checkIn.getTime())) {
    return false;
  }

  return checkIn < cutoffTime;
}

/**
 * Filters a list of visitors down to those who should be transitioned to AUTO_CHECKED_OUT.
 */
export function filterEligibleForReconciliation(
  visitors: VisitorRecord[],
  cutoffTime: Date = getAccraMidnightCutoff()
): VisitorRecord[] {
  return visitors.filter((v) => isEligibleForAutoCheckout(v, cutoffTime));
}
