import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import { doctorService, referenceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import type { DoctorDto, HospitalDto, SpecialismDto } from '../../types';

export const DoctorProfilePage = () => {
  const [profile, setProfile] = useState<DoctorDto | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [specialisms, setSpecialisms] = useState<SpecialismDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [{ doctor, profilePictureUrl }, hospitalsData, specialismsData] = await Promise.all([
        doctorService.getMyProfile(),
        referenceService.getHospitals(),
        referenceService.getSpecialisms(),
      ]);
      setProfile(doctor);
      setPictureUrl(profilePictureUrl);
      setHospitals(hospitalsData);
      setSpecialisms(specialismsData);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load profile');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getHospitalName = (hospitalId: number) =>
    hospitals.find((h) => h.hospitalId === hospitalId)?.name || 'Unknown';

  const getSpecialismName = (specialistId: number) =>
    specialisms.find((s) => s.specialistId === specialistId)?.specialism || 'Unknown';

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

      <div className="card space-y-6">
        <div className="flex items-center gap-4">
          {pictureUrl ? (
            <img src={pictureUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <UserCircle className="w-20 h-20 text-gray-300" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          <div>
            <label className="label">Full Name</label>
            <p className="text-gray-900 font-medium">{profile.name}</p>
          </div>

          <div>
            <label className="label">IC/Passport Number</label>
            <p className="text-gray-900 font-medium">{profile.icPassport}</p>
          </div>

          <div>
            <label className="label">Specialism</label>
            <p className="text-gray-900 font-medium">{getSpecialismName(profile.specialistId)}</p>
          </div>

          <div>
            <label className="label">Hospital</label>
            <p className="text-gray-900 font-medium">{getHospitalName(profile.hospitalId)}</p>
          </div>

          <div>
            <label className="label">Contact Number</label>
            <p className="text-gray-900 font-medium">{profile.contactNumber}</p>
          </div>

          <div>
            <label className="label">Medical License</label>
            <p className="text-gray-900 font-medium">{profile.medicalLicense}</p>
          </div>

          <div>
            <label className="label">Status</label>
            <p className="text-gray-900 font-medium">{profile.status}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Need to update your information?</h3>
            <p className="text-sm text-gray-700">
              Doctor profiles can only be updated by an administrator. Please contact hospital
              administration at +60123456789 or visit the hospital reception to update your details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
