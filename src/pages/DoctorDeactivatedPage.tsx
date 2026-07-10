import { useAuth } from '../contexts/AuthContext';

export const DoctorDeactivatedPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">⚠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deactivated</h1>
        <p className="text-gray-600 mb-6">
          Your doctor account has been deactivated. Please contact an administrator for assistance.
        </p>
        <button onClick={logout} className="btn-primary w-full">
          Logout
        </button>
      </div>
    </div>
  );
};
