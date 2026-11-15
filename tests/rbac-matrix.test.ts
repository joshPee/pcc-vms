import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UserRole,
  ALL_ROLES,
  ROUTE_POLICIES,
  evaluateRoleAccess,
} from '../src/lib/rbac-rules';

test('Phase 1 - Task 5: Server-side RBAC Matrix & Station Isolation', async (t) => {
  await t.test('Unauthenticated requests are rejected with 401 across all route policies', () => {
    for (const [policyName, allowedRoles] of Object.entries(ROUTE_POLICIES)) {
      const result = evaluateRoleAccess(null, allowedRoles);
      assert.equal(result.allowed, false, `Policy ${policyName} should block null user`);
      assert.equal(result.statusCode, 401, `Policy ${policyName} should return 401`);
    }
  });

  await t.test('Gate Station Isolation Rule: Only security_officer and supervisor can access gate terminal; admin is restricted', () => {
    const policy = ROUTE_POLICIES.GATE_STATION;

    // Allowed on gate duty
    assert.equal(evaluateRoleAccess('security_officer', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('supervisor', policy).statusCode, 200);

    // Explicitly forbidden to prevent gate station mixing
    assert.equal(evaluateRoleAccess('admin', policy).statusCode, 403);
    assert.equal(evaluateRoleAccess('sector_head', policy).statusCode, 403);
  });

  await t.test('Admin Portal Isolation Rule: Guards cannot access admin pages; admin, supervisor, sector_head are allowed', () => {
    const policy = ROUTE_POLICIES.ADMIN_PORTAL;

    // Allowed admin portal roles
    assert.equal(evaluateRoleAccess('admin', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('supervisor', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('sector_head', policy).statusCode, 200);

    // Guards are blocked from admin portal
    assert.equal(evaluateRoleAccess('security_officer', policy).statusCode, 403);
  });

  await t.test('Admin-Only Policy: Restricted strictly to admin role', () => {
    const policy = ROUTE_POLICIES.ADMIN_ONLY;

    assert.equal(evaluateRoleAccess('admin', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('supervisor', policy).statusCode, 403);
    assert.equal(evaluateRoleAccess('sector_head', policy).statusCode, 403);
    assert.equal(evaluateRoleAccess('security_officer', policy).statusCode, 403);
  });

  await t.test('Watchlist Administration: Restricted to admin and supervisor', () => {
    const policy = ROUTE_POLICIES.WATCHLIST_ADMIN;

    assert.equal(evaluateRoleAccess('admin', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('supervisor', policy).statusCode, 200);
    assert.equal(evaluateRoleAccess('sector_head', policy).statusCode, 403);
    assert.equal(evaluateRoleAccess('security_officer', policy).statusCode, 403);
  });

  await t.test('Full Cross-Product RBAC Matrix Verification', () => {
    const matrix: Record<string, Record<UserRole, boolean>> = {
      GATE_STATION: {
        security_officer: true,
        supervisor: true,
        admin: false,
        sector_head: false,
      },
      ADMIN_PORTAL: {
        security_officer: false,
        supervisor: true,
        admin: true,
        sector_head: true,
      },
      ADMIN_ONLY: {
        security_officer: false,
        supervisor: false,
        admin: true,
        sector_head: false,
      },
      WATCHLIST_ADMIN: {
        security_officer: false,
        supervisor: true,
        admin: true,
        sector_head: false,
      },
      AUDIT_MANAGEMENT: {
        security_officer: false,
        supervisor: true,
        admin: true,
        sector_head: true,
      },
    };

    for (const [policyKey, roleMap] of Object.entries(matrix)) {
      const allowedRoles = (ROUTE_POLICIES as any)[policyKey] as UserRole[];
      for (const role of ALL_ROLES) {
        const expected = roleMap[role];
        const res = evaluateRoleAccess(role, allowedRoles);
        assert.equal(
          res.allowed,
          expected,
          `Failed: Policy ${policyKey} for role ${role} should be ${expected ? 'ALLOWED (200)' : 'FORBIDDEN (403)'}`
        );
        assert.equal(res.statusCode, expected ? 200 : 403);
      }
    }
  });
});

