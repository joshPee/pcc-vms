import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  recordFailedLogin,
  isAccountLocked,
  clearFailedLogin,
  getClientIp,
} from '../src/lib/rate-limit';

describe('Phase 1 - Task 2: Protection & Rate Limiting for Gate Endpoints', () => {
  test('rate limiter permits requests below threshold and blocks upon exceeding', () => {
    const key = `test-ip-${Date.now()}`;
    const limit = 5;
    const windowMs = 5000;

    for (let i = 1; i <= limit; i++) {
      const result = checkRateLimit(key, limit, windowMs);
      assert.equal(result.success, true);
      assert.equal(result.remaining, limit - i);
    }

    // 6th request must exceed limit
    const blocked = checkRateLimit(key, limit, windowMs);
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.reset > 0);
  });

  test('brute-force account lockout locks after 5 consecutive failed attempts', () => {
    const account = `guard_station_${Date.now()}@pcc.gov.gh`;

    // 4 failed attempts: not locked yet
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedLogin(account);
      assert.equal(res.isLocked, false);
      assert.equal(isAccountLocked(account).locked, false);
    }

    // 5th failed attempt: triggers temporary lockout
    const fifth = recordFailedLogin(account);
    assert.equal(fifth.isLocked, true);
    assert.equal(fifth.remainingAttempts, 0);

    const lockStatus = isAccountLocked(account);
    assert.equal(lockStatus.locked, true);
    assert.ok(lockStatus.remainingMinutes! > 0);

    // Resetting/clearing after success unlocks
    clearFailedLogin(account);
    assert.equal(isAccountLocked(account).locked, false);
  });

  test('client IP extractor parses forwarded and direct headers', () => {
    const reqWithForwarded = new Request('http://localhost:3000', {
      headers: { 'x-forwarded-for': '197.251.134.2, 10.0.0.1' },
    });
    assert.equal(getClientIp(reqWithForwarded), '197.251.134.2');

    const reqWithRealIp = new Request('http://localhost:3000', {
      headers: { 'x-real-ip': '41.215.160.10' },
    });
    assert.equal(getClientIp(reqWithRealIp), '41.215.160.10');

    const reqDefault = new Request('http://localhost:3000');
    assert.equal(getClientIp(reqDefault), '127.0.0.1');
  });
});

