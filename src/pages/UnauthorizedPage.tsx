import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const dashboardMap = {
  Admin: '/admin',
  Doctor: '/doctor',
  Patient: '/patient',
};

export const UnauthorizedPage = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const homeLink = isAuthenticated && role ? dashboardMap[role] : '/login';
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
        <div className="text-gray-400 text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to view this page.
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
