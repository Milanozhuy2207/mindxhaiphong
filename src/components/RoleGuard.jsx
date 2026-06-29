import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * RoleGuard component to conditionally render children based on user role.
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to view the children (e.g., ['super_admin', 'admin'])
 * @param {React.ReactNode} props.children - The elements to render if the role matches
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { userRole } = useAuth();

  if (!userRole) return null;

  if (allowedRoles.includes(userRole)) {
    return children;
  }

  return null;
}
