import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { referenceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import type { DoctorDirectoryDto } from '../../types';

export const PatientViewDoctorsPage = () => {
  const [doctors, setDoctors] = useState<DoctorDirectoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await referenceService.getDoctorDirectory();
      // Filter only active doctors
      setDoctors(data.filter(d => d.status === 'Active'));
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load doctors');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialismName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading doctors...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Doctors</h1>
        <p className="text-gray-600 mt-2">Browse our specialist doctors and book an appointment</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by doctor name, specialism, or hospital..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field w-full md:w-96"
        />
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'No doctors found matching your search.' : 'No doctors available.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Link
              key={doctor.doctorId}
              to="/patient/book"
              state={{ selectedDoctorId: doctor.doctorId }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
            >
              {/* Doctor Image */}
              <div className="w-full h-48 bg-gradient-to-br from-pantai-100 to-pantai-200 flex items-center justify-center">
                {doctor.profilePictureThumbnailUrl ? (
                  <img
                    src={doctor.profilePictureThumbnailUrl}
                    alt={doctor.name}
                    className="w-28 h-28 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-pantai-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Doctor Info */}
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {doctor.name}
                </h3>
                <p className="text-primary font-medium mb-1">
                  {doctor.specialismName}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {doctor.hospitalName}
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-sm text-pantai-600 hover:text-pantai-700 font-medium">
                    Schedule Appointment →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
