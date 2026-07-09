import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { DASHBOARD_PATHS } from '../utils/dashboardPaths';

const TEST_ACCOUNTS = [
  { role: 'Admin', username: 'admin1', password: 'Password123!' },
  { role: 'Doctor', username: 'doctor1', password: 'Password123!' },
  { role: 'Patient', username: 'patient1', password: 'Password123!' },
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillTestAccount = (account: { username: string; password: string }) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await login({ username, password });
      navigate(DASHBOARD_PATHS[role]);
    } catch (err) {
      const message = getErrorMessage(err, 'Invalid username or password');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pantai-50 to-pantai-100 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to Pantai Hospital Portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary-dark font-semibold">
                Register as Patient
              </Link>
            </p>
          </div>

          {/* Test Accounts Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">
              Test Accounts (click to autofill):
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillTestAccount(account)}
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <strong>{account.role}:</strong> {account.username} / {account.password}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
