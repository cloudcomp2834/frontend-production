import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { DatePicker } from '../../components/ui/DatePicker';
import type { PatientUserDto } from '../../types';

export const PatientProfilePage = () => {
  const { patientId } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<PatientUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (patientId) {
      loadProfile();
    }
  }, [patientId]);

  const loadProfile = async () => {
    if (!patientId) return;

    try {
      const data = await patientService.getProfile(patientId);
      setProfile(data);
      setName(data.name);
      setDateOfBirth(data.dateOfBirth);
      setContactNumber(data.contactNumber ?? '');
      setEmail(data.email ?? '');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load profile');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!profile) return;
    setName(profile.name);
    setDateOfBirth(profile.dateOfBirth);
    setContactNumber(profile.contactNumber ?? '');
    setEmail(profile.email ?? '');
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setSaving(true);
    try {
      const updated = await patientService.updateProfile(patientId, {
        name,
        dateOfBirth,
        contactNumber,
        email,
      });
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to update profile');
      if (message) toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Profile not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Your personal information</p>
        </div>
        {!editing && (
          <button onClick={startEditing} className="btn-primary">
            Edit Profile
          </button>
        )}
      </div>

      <div className="card">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <DatePicker
                id="dateOfBirth"
                label={<>Date of Birth <span className="text-red-500">*</span></>}
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />

              <div>
                <label htmlFor="contactNumber" className="label">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <p className="text-sm text-gray-500">
              IC/Passport number, username, and role can't be changed here — contact hospital
              administration if those need updating.
            </p>

            <div className="flex justify-end space-x-4 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name</label>
                <p className="text-gray-900 font-medium">{profile.name}</p>
              </div>

              <div>
                <label className="label">IC/Passport Number</label>
                <p className="text-gray-900 font-medium">{profile.icPassport}</p>
              </div>

              <div>
                <label className="label">Username</label>
                <p className="text-gray-900 font-medium">{profile.username}</p>
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <p className="text-gray-900 font-medium">{profile.dateOfBirth}</p>
              </div>

              <div>
                <label className="label">Contact Number</label>
                <p className="text-gray-900 font-medium">{profile.contactNumber}</p>
              </div>

              <div>
                <label className="label">Email Address</label>
                <p className="text-gray-900 font-medium">{profile.email}</p>
              </div>

              <div>
                <label className="label">Patient ID</label>
                <p className="text-gray-900 font-medium">#{profile.patientId}</p>
              </div>

              <div>
                <label className="label">Account Role</label>
                <p className="text-gray-900 font-medium">{profile.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
