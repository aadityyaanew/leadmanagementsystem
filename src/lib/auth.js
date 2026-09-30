/**
 * @file auth.js
 * Central authentication utilities.
 *
 * Architecture decision: The existing system uses localStorage-based auth
 * (set by useLeads hook after /api/auth/login). We extend this with:
 * 1. A server-side session helper that reads from cookies (set during login).
 * 2. A client-side context that wraps the existing useLeads auth state.
 * 3. Centralized permission definitions that are the single source of truth.
 *
 * We deliberately preserve the existing localStorage auth flow used by the
 * CRMPage / Admin dashboard, and add cookie-based auth as a parallel
 * mechanism for server-side route validation.
 */

// ─── Permission Definitions ──────────────────────────────────────────────────
// Single source of truth for all role permissions.
// Each key is a DB role string. Values are permission flags.

export const ROLE_PERMISSIONS = {
  Admin: {
    // Lead permissions
    canViewAllLeads: true,
    canAddLeads: true,
    canEditLeads: true,
    canDeleteLeads: true,
    canBulkManage: true,
    canExportLeads: true,
    canImportLeads: true,
    canAssignCounsellor: true,
    canApproveAdmission: true,
    // User management
    canManageUsers: true,
    canManageUnits: true,
    canManageColleges: true,
    canManageCourses: true,
    // Navigation
    canViewCounsellors: true,
    canViewUnits: true,
    canViewAdminPanel: true,
    canViewDashboard: true,
  },
  BusinessManager: {
    canViewAllLeads: true,
    canAddLeads: true,
    canEditLeads: true,
    canDeleteLeads: false,
    canBulkManage: true,
    canExportLeads: true,
    canImportLeads: true,
    canAssignCounsellor: true,
    canApproveAdmission: false,
    canManageUsers: false,
    canManageUnits: true,
    canManageColleges: false,
    canManageCourses: false,
    canViewCounsellors: true,
    canViewUnits: true,
    canViewAdminPanel: false,
    canViewDashboard: true,
  },
  UnitHead: {
    canViewAllLeads: false, // Only their unit's leads
    canAddLeads: true,
    canEditLeads: true,
    canDeleteLeads: false,
    canBulkManage: true,
    canExportLeads: true,
    canImportLeads: false,
    canAssignCounsellor: true,
    canApproveAdmission: false,
    canManageUsers: false,
    canManageUnits: false,
    canManageColleges: false,
    canManageCourses: false,
    canViewCounsellors: true,
    canViewUnits: false,
    canViewAdminPanel: false,
    canViewDashboard: true,
  },
  Counsellor: {
    canViewAllLeads: false, // Only their own assigned leads
    canAddLeads: true,
    canEditLeads: true, // Only their own leads
    canDeleteLeads: false,
    canBulkManage: false,
    canExportLeads: false,
    canImportLeads: false,
    canAssignCounsellor: false,
    canApproveAdmission: false,
    canManageUsers: false,
    canManageUnits: false,
    canManageColleges: false,
    canManageCourses: false,
    canViewCounsellors: false,
    canViewUnits: false,
    canViewAdminPanel: false,
    canViewDashboard: true,
  },
};

// Role hierarchy (lower index = higher authority)
export const ROLE_HIERARCHY = ['Admin', 'BusinessManager', 'UnitHead', 'Counsellor'];

/**
 * Check if a role has a specific permission.
 * @param {string} role - DB role string
 * @param {string} permission - Permission key from ROLE_PERMISSIONS
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return Boolean(perms[permission]);
}

/**
 * Check if a role has at least the same authority as requiredRole.
 * @param {string} userRole - User's DB role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
export function hasMinimumRole(userRole, requiredRole) {
  const userRank = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRank = ROLE_HIERARCHY.indexOf(requiredRole);
  if (userRank === -1 || requiredRank === -1) return false;
  return userRank <= requiredRank;
}

/**
 * Get a human-readable label for a DB role.
 * @param {string} role
 * @returns {string}
 */
export function getRoleLabel(role) {
  const labels = {
    Admin: 'Chief Admission Officer',
    BusinessManager: 'Business Manager',
    UnitHead: 'Unit Head',
    Counsellor: 'Counsellor',
  };
  return labels[role] || role;
}

/**
 * Get a badge color class for a DB role.
 * @param {string} role
 * @returns {string}
 */
export function getRoleBadgeClass(role) {
  const classes = {
    Admin: 'bg-rose-50 text-[#8B1E1E] border-rose-200',
    BusinessManager: 'bg-rose-50 text-rose-700 border-rose-200',
    UnitHead: 'bg-purple-50 text-purple-700 border-purple-200',
    Counsellor: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return classes[role] || 'bg-slate-100 text-slate-700 border-slate-200';
}

/**
 * Map DB role to legacy USER_ROLES key used by the existing useLeads hook.
 * @param {string} dbRole
 * @returns {string}
 */
export function dbRoleToKey(dbRole) {
  const map = {
    Admin: 'ADMIN',
    BusinessManager: 'BUSINESS_MANAGER',
    UnitHead: 'UNIT_HEAD',
    Counsellor: 'COUNSELLOR',
  };
  return map[dbRole] || 'COUNSELLOR';
}

// ─── Server-side session reading from cookies ────────────────────────────────
// The login API sets a JSON cookie "lms_session" when the user logs in.
// This allows server components and middleware to read the session.

export const SESSION_COOKIE = 'lms_session';

/**
 * Parse a session object from a cookie string value.
 * @param {string|null} cookieValue
 * @returns {object|null}
 */
export function parseSessionCookie(cookieValue) {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
}

/**
 * Serialize a session object for storing in a cookie.
 * @param {object} session
 * @returns {string}
 */
export function serializeSessionCookie(session) {
  return encodeURIComponent(JSON.stringify(session));
}
