/**
 * Per-category overstay rule evaluation
 */

export interface VisitorCategoryRule {
  name: string;
  overstay_minutes: number;
  multi_day: boolean;
}

export const DEFAULT_CATEGORY_RULES: Record<string, VisitorCategoryRule> = {
  official: { name: 'Official', overstay_minutes: 240, multi_day: false },
  contractor: { name: 'Contractor', overstay_minutes: 480, multi_day: false },
  vip: { name: 'VIP', overstay_minutes: 480, multi_day: false },
  personal: { name: 'Personal', overstay_minutes: 180, multi_day: false },
  delivery: { name: 'Delivery', overstay_minutes: 60, multi_day: false },
  'guest house': { name: 'Guest House', overstay_minutes: 1440, multi_day: true },
  guesthouse: { name: 'Guest House', overstay_minutes: 1440, multi_day: true },
  guest_house: { name: 'Guest House', overstay_minutes: 1440, multi_day: true },
  conference: { name: 'Conference', overstay_minutes: 1440, multi_day: true },
};

export const DEFAULT_OVERSTAY_MINUTES = 240;

export function resolveCategoryRule(
  visitorType?: string | null,
  customRules?: Record<string, VisitorCategoryRule>
): VisitorCategoryRule {
  const normalized = (visitorType || '').trim().toLowerCase();
  if (customRules && customRules[normalized]) {
    return customRules[normalized];
  }
  if (DEFAULT_CATEGORY_RULES[normalized]) {
    return DEFAULT_CATEGORY_RULES[normalized];
  }
  return {
    name: visitorType || 'Standard',
    overstay_minutes: DEFAULT_OVERSTAY_MINUTES,
    multi_day: false,
  };
}

export interface OverstayEvaluationInput {
  checkInDate: Date | string;
  expectedDeparture?: Date | string | null;
  visitorType?: string | null;
  now?: Date | string;
  customRules?: Record<string, VisitorCategoryRule>;
}

export interface OverstayEvaluationResult {
  isOverstay: boolean;
  minutesOnSite: number;
  thresholdMinutes: number;
  multiDayExempt: boolean;
  reason?: 'PAST_EXPECTED_DEPARTURE' | 'EXCEEDED_CATEGORY_THRESHOLD';
}

export function evaluateOverstay(input: OverstayEvaluationInput): OverstayEvaluationResult {
  const checkIn = new Date(input.checkInDate).getTime();
  const now = input.now ? new Date(input.now).getTime() : Date.now();
  const minutesOnSite = Math.max(0, Math.floor((now - checkIn) / 60000));

  const rule = resolveCategoryRule(input.visitorType, input.customRules);

  // Multi-day visits (e.g. Guest House, Conference) do NOT trigger daily overstay warnings
  if (rule.multi_day) {
    return {
      isOverstay: false,
      minutesOnSite,
      thresholdMinutes: rule.overstay_minutes,
      multiDayExempt: true,
    };
  }

  // 1. Explicit expected departure takes precedence
  if (input.expectedDeparture) {
    const expected = new Date(input.expectedDeparture).getTime();
    if (now > expected) {
      return {
        isOverstay: true,
        minutesOnSite,
        thresholdMinutes: rule.overstay_minutes,
        multiDayExempt: false,
        reason: 'PAST_EXPECTED_DEPARTURE',
      };
    }
  }

  // 2. Category threshold check
  if (minutesOnSite >= rule.overstay_minutes) {
    return {
      isOverstay: true,
      minutesOnSite,
      thresholdMinutes: rule.overstay_minutes,
      multiDayExempt: false,
      reason: 'EXCEEDED_CATEGORY_THRESHOLD',
    };
  }

  return {
    isOverstay: false,
    minutesOnSite,
    thresholdMinutes: rule.overstay_minutes,
    multiDayExempt: false,
  };
}
