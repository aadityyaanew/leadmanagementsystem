export const ROLES = {
  ADMIN: 'admin',
  BUSINESS_MANAGER: 'business_manager',
  UNIT_HEAD: 'unit_head',
  COUNSELLOR: 'counsellor',
};

// Hierarchy definition for permission checks
// Lower index = higher access level
export const ROLE_HIERARCHY = [
  ROLES.ADMIN,
  ROLES.BUSINESS_MANAGER,
  ROLES.UNIT_HEAD,
  ROLES.COUNSELLOR,
];

/**
 * Utility to check if a user has required permissions
 * @param {string} userRole - The role of the current user
 * @param {string} requiredRole - The minimum role required for access
 * @returns {boolean} - true if user has permission
 */
export const hasPermission = (userRole, requiredRole) => {
  const userRank = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRank = ROLE_HIERARCHY.indexOf(requiredRole);
  
  if (userRank === -1 || requiredRank === -1) return false;
  return userRank <= requiredRank;
};
