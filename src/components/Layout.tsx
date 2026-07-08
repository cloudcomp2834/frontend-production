import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_PATHS } from '../utils/dashboardPaths';

interface LayoutProps {
  children: ReactNode;
}

const NO_BACK_ARROW_PATHS = ['/', '/login', '/register', '/admin', '/doctor', '/patient'];

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, role, username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const showBackArrow = !NO_BACK_ARROW_PATHS.includes(location.pathname);
  const canGoBack = location.key !== 'default';

  const getDashboardLink = () => {
    if (!role) return '/';
    return DASHBOARD_PATHS[role];
  };

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? getDashboardLink() : '/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {showBackArrow && (
                <button
                  onClick={handleBack}
                  aria-label="Go back"
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors duration-150 mr-2 text-gray-600"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Logo */}
              <Link to={isAuthenticated ? getDashboardLink() : '/'} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">Pantai Hospital</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{username}</span> ({role})
                  </span>
                  <button
                    onClick={logout}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Pantai Hospital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
