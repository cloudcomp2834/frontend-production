import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { referenceService, scheduleService, appointmentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { DoctorDirectoryDto, AppointmentTypeDto, DoctorAvailabilityDto, CreateAppointmentRequest } from '../../types';

interface BookingLocationState {
  selectedDoctorId?: number;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const TIME_STEP_MINUTES = 15;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.substring(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getStartTimeOptions = (slots: DoctorAvailabilityDto[]) => {
  const options = slots.flatMap(slot => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    const times: string[] = [];

    for (let current = start; current + TIME_STEP_MINUTES <= end; current += TIME_STEP_MINUTES) {
      times.push(minutesToTime(current));
    }

    return times;
  });

  return Array.from(new Set(options)).sort();
};

const getEndTimeOptions = (slot: DoctorAvailabilityDto | undefined, selectedStartTime: string) => {
  if (!slot || !selectedStartTime) return [];

  const start = timeToMinutes(selectedStartTime) + TIME_STEP_MINUTES;
  const end = timeToMinutes(slot.endTime);
  const options: string[] = [];

  for (let current = start; current <= end; current += TIME_STEP_MINUTES) {
    options.push(minutesToTime(current));
  }

  if (!options.includes(slot.endTime.substring(0, 5))) {
    options.push(slot.endTime.substring(0, 5));
  }

  return Array.from(new Set(options)).sort();
};

const findContainingSlot = (slots: DoctorAvailabilityDto[], startTime: string, endTime?: string) => {
  if (!startTime) return undefined;

  const start = timeToMinutes(startTime);
  const end = endTime ? timeToMinutes(endTime) : start + TIME_STEP_MINUTES;

  return slots.find(slot => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return start >= slotStart && end <= slotEnd;
  });
};

export const PatientBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useAuth();
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorDirectoryDto[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeDto[]>([]);
  const [availableSlots, setAvailableSlots] = useState<DoctorAvailabilityDto[]>([]);
  const [calendarAvailableSlots, setCalendarAvailableSlots] = useState<DoctorAvailabilityDto[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
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
      const selectedDoctorId = (location.state as BookingLocationState | null)?.selectedDoctorId;
      
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
      const message = getErrorMessage(err, 'Failed to load booking data');
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [location.state, toast]);

  const loadAvailableSchedules = useCallback(async (doctorId: number, month: Date) => {
    if (!doctorId) {
      setCalendarAvailableSlots([]);
      return;
    }

    const today = new Date();
    const monthStart = startOfMonth(month);
    const fromDate = monthStart < startOfMonth(today) ? today : monthStart;
    const toDate = endOfMonth(month);

    setAvailabilityLoading(true);
    try {
      const data = await scheduleService.getAvailability(
        doctorId,
        formatDate(fromDate),
        formatDate(toDate)
      );
      setCalendarAvailableSlots(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load available appointment dates');
      if (message) toast.error(message);
      setCalendarAvailableSlots([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [toast]);

  const loadAvailableSlots = useCallback(async () => {
    if (!formData.doctorId || !formData.appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      const data = await scheduleService.getAvailability(
        formData.doctorId,
        formData.appointmentDate,
        formData.appointmentDate
      );
      setAvailableSlots(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load available time slots');
      if (message) toast.error(message);
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.appointmentDate, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const numericFields = ['doctorId', 'appointmentCategoryId'];
    const value = numericFields.includes(e.target.name) ? parseInt(e.target.value) : e.target.value;
    const resetBookingSelection = e.target.name === 'doctorId';
    const resetEndTime = e.target.name === 'startTime';

    setFormData({
      ...formData,
      [e.target.name]: value,
      ...(resetBookingSelection ? { appointmentDate: '', startTime: '', endTime: '' } : {}),
      ...(resetEndTime ? { endTime: '' } : {}),
    });

    if (resetBookingSelection) {
      setAvailableSlots([]);
      setCalendarAvailableSlots([]);
      setCalendarOpen(false);
      setCalendarMonth(startOfMonth(new Date()));
    }
  };

  const availableDates = new Set(calendarAvailableSlots.map(slot => slot.date));
  const firstCalendarDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarStartOffset = firstCalendarDay.getDay();
  const daysInCalendarMonth = endOfMonth(calendarMonth).getDate();
  const todayDate = formatDate(new Date());
  const canGoToPreviousMonth = startOfMonth(calendarMonth) > startOfMonth(new Date());

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: date,
      startTime: '',
      endTime: '',
    }));
    setCalendarOpen(false);
  };

  const handleCalendarOpen = () => {
    setCalendarOpen(true);
    void loadAvailableSchedules(formData.doctorId, calendarMonth);
  };

  const handleCalendarMonthChange = (month: Date) => {
    const nextMonth = startOfMonth(month);
    setCalendarMonth(nextMonth);
    void loadAvailableSchedules(formData.doctorId, nextMonth);
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

    if (!findContainingSlot(availableSlots, formData.startTime, formData.endTime)) {
      setError('Selected time must stay within one available time slot');
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
      const message = getErrorMessage(err, 'Failed to book appointment');
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.doctorId === formData.doctorId);
  const startTimeOptions = getStartTimeOptions(availableSlots);
  const selectedStartSlot = findContainingSlot(availableSlots, formData.startTime);
  const endTimeOptions = getEndTimeOptions(selectedStartSlot, formData.startTime);

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
          <div className="relative">
            <input
              id="appointmentDate"
              name="appointmentDate"
              type="text"
              value={formData.appointmentDate}
              onClick={handleCalendarOpen}
              onFocus={handleCalendarOpen}
              className="input-field cursor-pointer"
              placeholder={formData.doctorId ? 'Select an available date' : 'Select a doctor first'}
              readOnly
              required
            />

            {calendarOpen && (
              <div className="absolute z-20 mt-2 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    className="btn-secondary px-3 py-1 text-sm"
                    disabled={!canGoToPreviousMonth}
                  >
                    Previous
                  </button>
                  <div className="font-semibold text-gray-900">{formatMonthLabel(calendarMonth)}</div>
                  <button
                    type="button"
                    onClick={() => handleCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="btn-secondary px-3 py-1 text-sm"
                  >
                    Next
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendarStartOffset }).map((_, index) => (
                    <div key={`blank-${index}`} className="h-9" />
                  ))}
                  {Array.from({ length: daysInCalendarMonth }).map((_, index) => {
                    const day = index + 1;
                    const date = formatDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                    const isAvailable = availableDates.has(date);
                    const isPast = date < todayDate;
                    const isSelected = formData.appointmentDate === date;
                    const disabled = !isAvailable || isPast || availabilityLoading;

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        disabled={disabled}
                        className={`h-9 rounded-md text-sm ${
                          isSelected
                            ? 'bg-primary text-white'
                            : isAvailable && !isPast
                              ? 'bg-pantai-50 text-pantai-700 hover:bg-pantai-100'
                              : 'cursor-not-allowed bg-gray-50 text-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{availabilityLoading ? 'Loading available dates...' : 'Only scheduled days can be selected.'}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="font-medium text-primary hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Schedule Slots */}
        {formData.appointmentDate && availableSlots.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Available Time Slots on {formData.appointmentDate}:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              {availableSlots.map((slot, index) => (
                <div key={`${slot.date}-${slot.startTime}-${slot.endTime}-${index}`}>
                  • {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Existing appointments have already been removed from these slots.
            </p>
          </div>
        )}

        {formData.appointmentDate && availableSlots.length === 0 && (
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
            <select
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="input-field"
              disabled={!formData.appointmentDate || availableSlots.length === 0}
              required
            >
              <option value="">Select start time</option>
              {startTimeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="endTime" className="label">
              End Time <span className="text-red-500">*</span>
            </label>
            <select
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="input-field"
              disabled={!formData.startTime || endTimeOptions.length === 0}
              required
            >
              <option value="">Select end time</option>
              {endTimeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
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
            disabled={submitting || availableSlots.length === 0}
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};
