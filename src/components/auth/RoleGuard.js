import { hasPermission } from '@/lib/constants/roles';

/**
 * A wrapper component that conditionally renders its children
 * based on the user's role and the required role.
 * 
 * @param {Object} props
 * @param {string} props.userRole - The current user's role (usually from context or session)
 * @param {string} props.requiredRole - The minimum role required to view this content
 * @param {React.ReactNode} props.children - The UI to render if permitted
 * @param {React.ReactNode} [props.fallback=null] - UI to render if not permitted
 */
export default function RoleGuard({ userRole, requiredRole, children, fallback = null }) {
  if (hasPermission(userRole, requiredRole)) {
    return <>{children}</>;
  }
  
  return fallback;
}
