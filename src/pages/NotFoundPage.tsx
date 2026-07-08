import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_PATHS } from '../utils/dashboardPaths';

export const NotFoundPage = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const homeLink = isAuthenticated && role ? DASHBOARD_PATHS[role] : '/login';
  const homeLabel = isAuthenticated && role ? 'Go to My Dashboard' : 'Go to Login';

  const handleGoBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(homeLink);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="card text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🧭</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleGoBack} className="btn-secondary">
            Go Back
          </button>
          <button onClick={() => navigate(homeLink)} className="btn-primary">
            {homeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
