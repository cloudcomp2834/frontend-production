import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_PATHS } from '../utils/dashboardPaths';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

// Guards routes that only make sense when signed out (login, register) -
// an already-authenticated user hitting these should land on their
// dashboard instead of seeing the form again.
export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={DASHBOARD_PATHS[role]} replace />;
  }

  return <>{children}</>;
};
