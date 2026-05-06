import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { RoleCode } from '../../types';

interface CanAccessProps {
  roles: RoleCode[];
  children: ReactNode;
}

/**
 * Renders children only if the current user has one of the allowed roles.
 * Usage: <CanAccess roles={['ADMIN']}><Button>Crear Rol</Button></CanAccess>
 */
export default function CanAccess({ roles, children }: CanAccessProps) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.roleCode)) return null;
  return <>{children}</>;
}
