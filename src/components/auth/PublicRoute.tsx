import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function PublicRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return !token ? <Outlet /> : <Navigate to="/" replace />;
}
