import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { referenceService, scheduleService, appointmentService } from '../../services';
import { ApiError } from '../../services/api';
import type { DoctorDirectoryDto, AppointmentTypeDto, DoctorScheduleDto, CreateAppointmentRequest } from '../../types';

export const PatientBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useAuth();
  const [doctors, setDoctors] = useState<DoctorDirectoryDto[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeDto[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    doctorId: 0,
    appointmentCategoryId: 0,
    appointmentDate: '',
    startTime: '',
    endTime: '',
    medicalConcern: '',
  });

  const loadInitialData = useCallback(async () => {
    try {
      // Get pre-selected doctor from navigation state
      const selectedDoctorId = (location.state as any)?.selectedDoctorId;
      
      const [doctorsData, typesData] = await Promise.all([
        referenceService.getDoctorDirectory(),
        referenceService.getAppointmentTypes(),
      ]);
      
      // Filter only active doctors
      const activeDoctors = doctorsData.filter(d => d.status === 'Active');
      setDoctors(activeDoctors);
      setAppointmentTypes(typesData);

      // Set initial doctor - use pre-selected or first available
      const initialDoctorId = selectedDoctorId || (activeDoctors.length > 0 ? activeDoctors[0].doctorId : 0);
      
      if (initialDoctorId) {
        setFormData(prev => ({ ...prev, doctorId: initialDoctorId }));
      }
      if (typesData.length > 0) {
        setFormData(prev => ({ ...prev, appointmentCategoryId: typesData[0].appointmentCategoryId }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  const loadSchedules = useCallback(async () => {
    if (!formData.doctorId || !formData.appointmentDate) {
      setSchedules([]);
      return;
    }

    try {
      const data = await scheduleService.getSchedules(
        formData.doctorId,
        formData.appointmentDate,
        formData.appointmentDate
      );
      setSchedules(data);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setSchedules([]);
    }
  }, [formData.doctorId, formData.appointmentDate]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setError('');

    // Validate times
    if (!formData.startTime || !formData.endTime) {
      setError('Please select both start and end time');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    setSubmitting(true);

    const requestData: CreateAppointmentRequest = {
      appointmentCategoryId: formData.appointmentCategoryId,
      doctorId: formData.doctorId,
      patientId,
      appointmentDate: formData.appointmentDate,
      medicalConcern: formData.medicalConcern,
      startTime: formData.startTime + ':00',
      endTime: formData.endTime + ':00',
    };

    try {
      await appointmentService.create(requestData);
      navigate('/patient/appointments');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to book appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.doctorId === formData.doctorId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-2">Schedule an appointment with our specialist doctors</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Select Doctor */}
        <div>
          <label htmlFor="doctorId" className="label">
            Select Doctor <span className="text-red-500">*</span>
          </label>
          <select
            id="doctorId"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            className="input-field"
            required
          >
            {doctors.map((doctor) => (
              <option key={doctor.doctorId} value={doctor.doctorId}>
                {doctor.name} - {doctor.specialismName} ({doctor.hospitalName})
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Info */}
        {selectedDoctor && (
          <div className="bg-pantai-50 border border-pantai-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedDoctor.name}</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Specialism:</strong> {selectedDoctor.specialismName}</p>
              <p><strong>Hospital:</strong> {selectedDoctor.hospitalName}</p>
              <p><strong>Contact:</strong> {selectedDoctor.contactNumber}</p>
            </div>
          </div>
        )}

        {/* Appointment Type */}
        <div>
          <label htmlFor="appointmentCategoryId" className="label">
            Appointment Type <span className="text-red-500">*</span>
          </label>
          <select
            id="appointmentCategoryId"
            name="appointmentCategoryId"
            value={formData.appointmentCategoryId}
            onChange={handleChange}
            className="input-field"
            required
          >
            {appointmentTypes.map((type) => (
              <option key={type.appointmentCategoryId} value={type.appointmentCategoryId}>
                {type.type}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="appointmentDate" className="label">
            Appointment Date <span className="text-red-500">*</span>
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="date"
            value={formData.appointmentDate}
            onChange={handleChange}
            className="input-field"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Available Schedule Slots */}
        {formData.appointmentDate && schedules.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Available Time Slots on {formData.appointmentDate}:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              {schedules.map((schedule) => (
                <div key={schedule.scheduleId}>
                  • {schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Your selected time must fall within one of these slots
            </p>
          </div>
        )}

        {formData.appointmentDate && schedules.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            No available time slots for this date. Please choose a different date or doctor.
          </div>
        )}

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="label">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="endTime" className="label">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Medical Concern */}
        <div>
          <label htmlFor="medicalConcern" className="label">
            Medical Concern (Optional)
          </label>
          <textarea
            id="medicalConcern"
            name="medicalConcern"
            value={formData.medicalConcern}
            onChange={handleChange}
            className="input-field"
            rows={3}
            placeholder="Describe your medical concern..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || schedules.length === 0}
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};
