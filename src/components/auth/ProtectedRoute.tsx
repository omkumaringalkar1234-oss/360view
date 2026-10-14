import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin-slow text-primary-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: window.location.pathname }} />;
  }

  return <>{children ? children : <Outlet />}</>;
}

export function PublicRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin-slow text-primary-500">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children ? children : <Outlet />}</>;
}