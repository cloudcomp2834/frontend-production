import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService, referenceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { CreateDoctorWithUserRequest, HospitalDto, SpecialismDto } from '../../types';

export const AdminAddDoctorPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [specialisms, setSpecialisms] = useState<SpecialismDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<CreateDoctorWithUserRequest>({
    icPassport: '',
    username: '',
    password: '',
    name: '',
    specialistId: 0,
    contactNumber: '',
    status: 'Active',
    medicalLicense: '',
    hospitalId: 0,
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [hospitalsData, specialismsData] = await Promise.all([
        referenceService.getHospitals(),
        referenceService.getSpecialisms(),
      ]);
      setHospitals(hospitalsData);
      setSpecialisms(specialismsData);
      
      // Set default values
      if (hospitalsData.length > 0) {
        setFormData(prev => ({ ...prev, hospitalId: hospitalsData[0].hospitalId }));
      }
      if (specialismsData.length > 0) {
        setFormData(prev => ({ ...prev, specialistId: specialismsData[0].specialistId }));
      }
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load reference data');
      if (message) toast.error(message);
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
    setError('');
    setLoading(true);

    try {
      await doctorService.create(formData);
      navigate('/admin/doctors');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to create doctor');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Doctor</h1>
        <p className="text-gray-600 mt-2">Create a new doctor profile and login account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IC/Passport */}
          <div>
            <label htmlFor="icPassport" className="label">
              IC/Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              id="icPassport"
              name="icPassport"
              type="text"
              value={formData.icPassport}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="label">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
              minLength={8}
            />
          </div>

          {/* Name */}
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

          {/* Medical License */}
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

          {/* Contact Number */}
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

          {/* Specialism */}
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

          {/* Hospital */}
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

          {/* Status */}
          <div>
            <label htmlFor="status" className="label">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Doctor'}
          </button>
        </div>
      </form>
    </div>
  );
};
