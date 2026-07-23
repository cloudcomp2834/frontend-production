import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService, referenceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { DoctorDto, HospitalDto, SpecialismDto } from '../../types';

export const AdminDoctorsPage = () => {
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [specialisms, setSpecialisms] = useState<SpecialismDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [doctorsData, hospitalsData, specialismsData] = await Promise.all([
        doctorService.getAll(),
        referenceService.getHospitals(),
        referenceService.getSpecialisms(),
      ]);
      setDoctors(doctorsData);
      setHospitals(hospitalsData);
      setSpecialisms(specialismsData);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load doctors');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (doctorId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await doctorService.updateStatus(doctorId, newStatus);
      await loadData();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to update doctor status');
      if (message) toast.error(message);
    }
  };

  const getHospitalName = (hospitalId: number) => {
    return hospitals.find(h => h.hospitalId === hospitalId)?.name || 'Unknown';
  };

  const getSpecialismName = (specialistId: number) => {
    return specialisms.find(s => s.specialistId === specialistId)?.specialism || 'Unknown';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600 mt-2">Manage doctor profiles and access</p>
        </div>
        <Link to="/admin/doctors/new" className="btn-primary">
          + Add Doctor
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialism
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.doctorId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-500">{doctor.medicalLicense}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getSpecialismName(doctor.specialistId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getHospitalName(doctor.hospitalId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.contactNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doctor.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/doctors/${doctor.doctorId}/schedule`}
                      className="text-primary hover:text-primary-dark"
                    >
                      Schedule
                    </Link>
                    <button
                      onClick={() => handleStatusToggle(doctor.doctorId, doctor.status)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {doctor.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
