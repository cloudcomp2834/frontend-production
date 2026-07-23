import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { doctorService, referenceService } from '../../services';
import { ApiError, getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { UpdateDoctorProfileRequest, HospitalDto, SpecialismDto } from '../../types';

export const AdminEditDoctorPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { doctorId } = useParams<{ doctorId: string }>();
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [specialisms, setSpecialisms] = useState<SpecialismDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateDoctorProfileRequest>({
    name: '',
    specialistId: 0,
    contactNumber: '',
    medicalLicense: '',
    hospitalId: 0,
  });

  useEffect(() => {
    loadData();
  }, [doctorId]);

  const loadData = async () => {
    if (!doctorId) return;

    try {
      const [doctor, hospitalsData, specialismsData] = await Promise.all([
        doctorService.getById(Number(doctorId)),
        referenceService.getHospitals(),
        referenceService.getSpecialisms(),
      ]);
      setHospitals(hospitalsData);
      setSpecialisms(specialismsData);
      setFormData({
        name: doctor.name,
        specialistId: doctor.specialistId,
        contactNumber: doctor.contactNumber,
        medicalLicense: doctor.medicalLicense,
        hospitalId: doctor.hospitalId,
      });
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load doctor');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }

    try {
      const { profilePictureUrl } = await doctorService.getProfilePicture(Number(doctorId));
      setPictureUrl(profilePictureUrl);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        const message = getErrorMessage(err, 'Failed to load profile picture');
        if (message) toast.error(message);
      }
    }
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!doctorId || !e.target.files?.[0]) return;

    setUploadingPicture(true);
    try {
      const { profilePictureUrl } = await doctorService.uploadProfilePicture(Number(doctorId), e.target.files[0]);
      setPictureUrl(profilePictureUrl);
      toast.success('Profile picture updated');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to upload profile picture');
      if (message) toast.error(message);
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    setError('');
    setSaving(true);

    try {
      await doctorService.updateProfile(Number(doctorId), formData);
      toast.success('Doctor profile updated successfully');
      navigate('/admin/doctors');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to update doctor');
      if (message) setError(message);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Doctor Profile</h1>
        <p className="text-gray-600 mt-2">
          Update this doctor's details. Doctors cannot edit their own profile — only an Admin can.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card space-y-6 mb-6">
        <div className="flex items-center gap-4">
          {pictureUrl ? (
            <img src={pictureUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <UserCircle className="w-20 h-20 text-gray-300" />
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePictureChange}
              className="hidden"
              id="profilePicture"
            />
            <label htmlFor="profilePicture" className="btn-secondary cursor-pointer inline-block">
              {uploadingPicture ? 'Uploading...' : pictureUrl ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="text-xs text-gray-500 mt-1">JPEG or PNG, up to 5 MB</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="label">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="medicalLicense" className="label">
              Medical License <span className="text-red-500">*</span>
            </label>
            <input
              id="medicalLicense"
              name="medicalLicense"
              type="text"
              value={formData.medicalLicense}
              onChange={handleChange}
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
              value={formData.contactNumber}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="specialistId" className="label">
              Specialism <span className="text-red-500">*</span>
            </label>
            <select
              id="specialistId"
              name="specialistId"
              value={formData.specialistId}
              onChange={handleChange}
              className="input-field"
              required
            >
              {specialisms.map((s) => (
                <option key={s.specialistId} value={s.specialistId}>
                  {s.specialism}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hospitalId" className="label">
              Hospital <span className="text-red-500">*</span>
            </label>
            <select
              id="hospitalId"
              name="hospitalId"
              value={formData.hospitalId}
              onChange={handleChange}
              className="input-field"
              required
            >
              {hospitals.map((h) => (
                <option key={h.hospitalId} value={h.hospitalId}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/doctors')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
