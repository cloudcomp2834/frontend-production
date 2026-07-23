import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import { getErrorMessage } from '../../services/api';

type NewUserRole = 'Admin' | 'Patient';

export const AdminAddUserPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<NewUserRole>('Patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [icPassport, setIcPassport] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'Admin') {
        await userService.createAdmin({
          icPassport,
          username,
          password,
          name,
          dob: dob || undefined,
        });
      } else {
        await userService.createPatient({
          icPassport,
          username,
          password,
          name,
          dateOfBirth,
          contactNumber,
          email,
        });
      }
      navigate('/admin/users');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create user');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-600 mt-2">
          Create a new Admin or Patient account. To add a Doctor, use "Add Doctor" instead.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="role" className="label">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as NewUserRole)}
            className="input-field"
            required
          >
            <option value="Patient">Patient</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="icPassport" className="label">
              IC/Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              id="icPassport"
              name="icPassport"
              type="text"
              value={icPassport}
              onChange={(e) => setIcPassport(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="label">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="name" className="label">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {role === 'Admin' && (
            <div>
              <label htmlFor="dob" className="label">
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {role === 'Patient' && (
            <>
              <div>
                <label htmlFor="dateOfBirth" className="label">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className="label">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/users')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};
