/**
 * Africa/Accra (GMT / UTC+0) Timezone Enforcement Utilities
 * Ghana observes Greenwich Mean Time year-round without Daylight Saving Time.
 */

export const ACCRA_TIMEZONE = 'Africa/Accra';

/**
 * Returns the current date/time formatted explicitly in Africa/Accra timezone.
 */
export function formatAccraDateTime(date: Date = new Date(), options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: ACCRA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
  };
  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(date);
}

/**
 * Returns the YYYY-MM-DD string representation of today in Africa/Accra.
 */
export function getAccraDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACCRA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Resolves the start and end of "Today" in Africa/Accra as UTC Date bounds.
 * Essential for accurate SQL queries checking "today's check-ins".
 */
export function getAccraDayBounds(date: Date = new Date()): { startOfDay: Date; endOfDay: Date } {
  const dateStr = getAccraDateString(date);
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  return { startOfDay, endOfDay };
}

/**
 * Determines whether a given timestamp falls within "today" in Africa/Accra.
 */
export function isTodayInAccra(timestamp: Date | string | number, referenceDate: Date = new Date()): boolean {
  const targetDate = new Date(timestamp);
  return getAccraDateString(targetDate) === getAccraDateString(referenceDate);
}
