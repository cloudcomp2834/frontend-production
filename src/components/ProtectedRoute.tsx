import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { DoctorDeactivatedPage } from '../pages/DoctorDeactivatedPage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('Admin' | 'Doctor' | 'Patient')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, role, doctorStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Login already blocks new sessions for deactivated doctors; this is a
  // defensive backstop in case a session's token was issued before a
  // deactivation, or ever carries a stale doctor_status claim.
  if (role === 'Doctor' && doctorStatus === 'Inactive') {
    return <DoctorDeactivatedPage />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
