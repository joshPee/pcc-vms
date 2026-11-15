import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessPage, canEditResource, type UserRole } from '../src/lib/rbac';
import { getUniquePassNumber } from '../src/lib/pass-generator';

describe('Phase 1 - Task 1: Guard-Driven Registration & Attributed Check-ins', () => {
  test('Guards and supervisors can access guard portal and registration', () => {
    assert.equal(canAccessPage('security_officer', '/guard'), true);
    assert.equal(canAccessPage('supervisor', '/guard'), true);
    assert.equal(canAccessPage('security_officer', '/admin/check-in'), true);
  });

  test('Admins are restricted from guard portal station to prevent station mixing', () => {
    assert.equal(canAccessPage('admin', '/guard'), false);
  });

  test('Unique pass numbers are generated in non-sequential format PCC-VXXXXXX', async () => {
    const pass = await getUniquePassNumber();
    assert.match(pass, /^PCC-V[A-Z0-9]{6}$/);
  });
});
