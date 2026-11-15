export type UserRole = 'admin' | 'security_officer' | 'supervisor' | 'sector_head';

export const ALL_ROLES: UserRole[] = [
  'admin',
  'security_officer',
  'supervisor',
  'sector_head',
];

export interface AccessResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403;
  error?: string;
}

/**
 * Evaluates whether a role is authorized for a given set of allowed roles.
 * Returns 401 when unauthenticated, 403 when forbidden, 200 when allowed.
 */
export function evaluateRoleAccess(
  userRole: UserRole | string | null | undefined,
  allowedRoles: UserRole[]
): AccessResult {
  if (!userRole) {
    return {
      allowed: false,
      statusCode: 401,
      error: 'Unauthorized: Authentication required.',
    };
  }

  if (!allowedRoles.includes(userRole as UserRole)) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}].`,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
  };
}

/**
 * Standard system route policies enforcing RBAC and station isolation.
 */
export const ROUTE_POLICIES = {
  // Gate station registration & terminal: Guards & supervisors on gate duty
  // Isolation: Admins cannot access gate station to prevent station mixing
  GATE_STATION: ['security_officer', 'supervisor'] as UserRole[],

  // Gate check-in and check-out scanning duty
  GATE_DUTY: ['security_officer', 'supervisor', 'admin', 'sector_head'] as UserRole[],

  // Administrative dashboard, reports, attendee rosters
  // Isolation: Security guards cannot access admin portal
  ADMIN_PORTAL: ['admin', 'supervisor', 'sector_head'] as UserRole[],

  // High-privilege system admin only (user management, database operations)
  ADMIN_ONLY: ['admin'] as UserRole[],

  // Watchlist administration (management & overrides)
  WATCHLIST_ADMIN: ['admin', 'supervisor'] as UserRole[],

  // Audit trails & incident reporting
  AUDIT_MANAGEMENT: ['admin', 'supervisor', 'sector_head'] as UserRole[],
};
