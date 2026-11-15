import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePasswordStrength,
  getSessionMaxAgeForRole,
  SESSION_MAX_AGE_SECONDS,
} from '../src/lib/password-policy';
import {
  isAccountLocked,
  recordFailedLogin,
  clearFailedLogin,
} from '../src/lib/rate-limit';

test('Phase 1 - Task 6: Authentication Hardening & Password Policy', async (t) => {
  await t.test('validatePasswordStrength rejects weak passwords', () => {
    // Too short (<8 chars)
    const shortRes = validatePasswordStrength('Ab1!xyz');
    assert.equal(shortRes.valid, false);
    assert.ok(shortRes.errors.some((e) => e.includes('at least 8 characters')));

    // No uppercase
    const noUpperRes = validatePasswordStrength('password123!');
    assert.equal(noUpperRes.valid, false);
    assert.ok(noUpperRes.errors.some((e) => e.includes('uppercase')));

    // No lowercase
    const noLowerRes = validatePasswordStrength('PASSWORD123!');
    assert.equal(noLowerRes.valid, false);
    assert.ok(noLowerRes.errors.some((e) => e.includes('lowercase')));

    // No number
    const noNumRes = validatePasswordStrength('Password!xyz');
    assert.equal(noNumRes.valid, false);
    assert.ok(noNumRes.errors.some((e) => e.includes('digit')));

    // No special character
    const noSpecialRes = validatePasswordStrength('Password123');
    assert.equal(noSpecialRes.valid, false);
    assert.ok(noSpecialRes.errors.some((e) => e.includes('special character')));
  });

  await t.test('validatePasswordStrength accepts strong enterprise passwords', () => {
    const validPasswords = [
      'Pcc@Secure2026',
      'Guard#Pass99',
      'Accra*Campus88',
      'S3cur1ty!Officer',
    ];

    for (const pwd of validPasswords) {
      const res = validatePasswordStrength(pwd);
      assert.equal(res.valid, true, `Expected valid: ${pwd}, got: ${res.errors.join(', ')}`);
      assert.equal(res.errors.length, 0);
    }
  });

  await t.test('Session timeout differentiation: Guard station tablets expire earlier than admin workstations', () => {
    const guardMaxAge = getSessionMaxAgeForRole('security_officer');
    const adminMaxAge = getSessionMaxAgeForRole('admin');
    const supervisorMaxAge = getSessionMaxAgeForRole('supervisor');

    assert.equal(guardMaxAge, SESSION_MAX_AGE_SECONDS.GUARD_STATION);
    assert.equal(guardMaxAge, 14400); // 4 hours in seconds

    assert.equal(adminMaxAge, SESSION_MAX_AGE_SECONDS.ADMIN_PORTAL);
    assert.equal(adminMaxAge, 28800); // 8 hours in seconds

    assert.equal(supervisorMaxAge, 28800);
    assert.ok(guardMaxAge < adminMaxAge, 'Guard tablet session should expire sooner than admin workstation');
  });

  await t.test('Account lockout enforces 5 failed attempts lockout threshold', () => {
    const testEmail = 'lockout-test-officer@pcc.gov.gh';
    clearFailedLogin(testEmail);

    for (let i = 1; i <= 4; i++) {
      const status = recordFailedLogin(testEmail);
      assert.equal(status.isLocked, false);
    }

    // 5th failed attempt locks the account
    const lockedStatus = recordFailedLogin(testEmail);
    assert.equal(lockedStatus.isLocked, true);

    const check = isAccountLocked(testEmail);
    assert.equal(check.locked, true);
    assert.ok((check.remainingMinutes || 0) > 0);

    // Clean up
    clearFailedLogin(testEmail);
    assert.equal(isAccountLocked(testEmail).locked, false);
  });
});
