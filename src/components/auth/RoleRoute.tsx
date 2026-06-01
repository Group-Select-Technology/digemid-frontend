import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { RoleCode } from '../../types';

interface RoleRouteProps {
  roles: RoleCode[];
}

export default function RoleRoute({ roles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !roles.includes(user.roleCode)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
