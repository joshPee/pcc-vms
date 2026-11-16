import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCategoryRule,
  evaluateOverstay,
  DEFAULT_CATEGORY_RULES,
} from '../src/lib/overstay';

test('Phase 2 - Task 10: Per-Category Overstay Rules', async (t) => {
  await t.test('resolves default thresholds per category correctly', () => {
    assert.equal(resolveCategoryRule('Delivery').overstay_minutes, 60);
    assert.equal(resolveCategoryRule('Personal').overstay_minutes, 180);
    assert.equal(resolveCategoryRule('Official').overstay_minutes, 240);
    assert.equal(resolveCategoryRule('Contractor').overstay_minutes, 480);
    assert.equal(resolveCategoryRule('VIP').overstay_minutes, 480);
    assert.equal(resolveCategoryRule('Guest House').multi_day, true);
    assert.equal(resolveCategoryRule('Conference').multi_day, true);
  });

  await t.test('multi-day visitors are exempt from daily overstay alerts', () => {
    // Guest House resident checked in 3 days (4320 mins) ago
    const checkIn = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = evaluateOverstay({
      checkInDate: checkIn,
      visitorType: 'Guest House',
    });

    assert.equal(result.isOverstay, false);
    assert.equal(result.multiDayExempt, true);
  });

  await t.test('triggers overstay when minutes on site exceed category threshold', () => {
    // Delivery driver on site for 90 minutes (threshold is 60)
    const checkIn = new Date(Date.now() - 90 * 60 * 1000);
    const deliveryResult = evaluateOverstay({
      checkInDate: checkIn,
      visitorType: 'Delivery',
    });

    assert.equal(deliveryResult.isOverstay, true);
    assert.equal(deliveryResult.reason, 'EXCEEDED_CATEGORY_THRESHOLD');
    assert.equal(deliveryResult.thresholdMinutes, 60);

    // Contractor on site for 90 minutes (threshold is 480) -> NOT overstay
    const contractorResult = evaluateOverstay({
      checkInDate: checkIn,
      visitorType: 'Contractor',
    });

    assert.equal(contractorResult.isOverstay, false);
    assert.equal(contractorResult.thresholdMinutes, 480);
  });

  await t.test('honors explicit expected departure if earlier than category threshold', () => {
    // Official visitor with explicit departure time in the past
    const checkIn = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const expected = new Date(Date.now() - 10 * 60 * 1000); // Expected to leave 10m ago

    const result = evaluateOverstay({
      checkInDate: checkIn,
      expectedDeparture: expected,
      visitorType: 'Official',
    });

    assert.equal(result.isOverstay, true);
    assert.equal(result.reason, 'PAST_EXPECTED_DEPARTURE');
  });
});
