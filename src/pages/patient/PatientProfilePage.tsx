import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services';
import { getErrorMessage } from '../../services/api';
import type { PatientUserDto } from '../../types';

export const PatientProfilePage = () => {
  const { patientId } = useAuth();
  const [profile, setProfile] = useState<PatientUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load profile');
      if (message) setError(message);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Your personal information</p>
      </div>

      <div className="card">
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

          <div className="pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Need to update your information?</h3>
              <p className="text-sm text-gray-700">
                Please contact the hospital administration at +60123456789 or visit the hospital reception
                to update your personal details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
