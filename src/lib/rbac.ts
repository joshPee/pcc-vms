export type UserRole = 'admin' | 'security_officer' | 'supervisor' | 'sector_head';

export interface Permission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'security_officer': 1,
  'supervisor': 2,
  'sector_head': 3,
  'admin': 4,
};

export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Dashboard - accessible by all
  '/admin/dashboard': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  
  // Visitors section - accessible by all
  '/admin/check-in': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  '/admin/visitors': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  '/admin/pre-registration': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  '/admin/visitor-history': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  '/admin/check-out': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  
  // Watchlist - view all, edit only supervisor+
  '/admin/watchlist': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  
  // Hosts & Staff - view all, edit only supervisor+
  '/admin/hosts-staff': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  
  // Vehicles - accessible by all
  '/admin/vehicles': ['security_officer', 'supervisor', 'sector_head', 'admin'],
  
  // Incidents - supervisor+
  '/admin/incidents': ['supervisor', 'sector_head', 'admin'],
  
  // Shift Handover - supervisor+
  '/admin/shift-handover': ['supervisor', 'sector_head', 'admin'],
  
  // Reports - supervisor+
  '/admin/reports': ['supervisor', 'sector_head', 'admin'],
  
  // Settings - sector_head only
  '/admin/settings': ['sector_head', 'admin'],
  '/admin/visitor-categories': ['sector_head', 'admin'],
  '/admin/audit-log': ['sector_head', 'admin'],
};

export function canAccessPage(userRole: UserRole, path: string): boolean {
  const allowedRoles = PAGE_PERMISSIONS[path];
  if (!allowedRoles) return true; // Default to allow if not explicitly defined
  return allowedRoles.includes(userRole);
}

export function canEditResource(userRole: UserRole, resource: string): boolean {
  const editPermissions: Record<string, UserRole[]> = {
    'watchlist': ['supervisor', 'sector_head', 'admin'],
    'hosts-staff': ['supervisor', 'sector_head', 'admin'],
    'visitor-categories': ['sector_head', 'admin'],
    'audit-log': ['sector_head', 'admin'],
    'settings': ['sector_head', 'admin'],
  };
  
  const allowedRoles = editPermissions[resource];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
}

export function getPermissions(userRole: UserRole, resource: string): Permission {
  return {
    canView: canAccessPage(userRole, `/admin/${resource}`),
    canEdit: canEditResource(userRole, resource),
    canDelete: canEditResource(userRole, resource), // Same as edit for now
  };
}