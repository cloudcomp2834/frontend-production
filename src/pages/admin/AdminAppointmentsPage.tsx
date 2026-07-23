import { useState, useEffect } from 'react';
import { appointmentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AppointmentDto } from '../../types';

type DateSortDirection = 'asc' | 'desc';

const getAppointmentDateTime = (appointment: AppointmentDto) =>
  new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();

const normalizeSearchValue = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '');

export const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSortDirection, setDateSortDirection] = useState<DateSortDirection>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load appointments');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments
    .filter((appointment) => {
      const term = normalizeSearchValue(searchTerm.trim());
      if (!term) return true;

      return [
        appointment.appointmentId.toString(),
        `#${appointment.appointmentId}`,
        appointment.doctorName,
        appointment.patientName,
      ].some((value) => normalizeSearchValue(value).includes(term));
    })
    .sort((a, b) => {
      const diff = getAppointmentDateTime(a) - getAppointmentDateTime(b);
      return dateSortDirection === 'asc' ? diff : -diff;
    });

  const handleDateSortToggle = () => {
    setDateSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
        <p className="text-gray-600 mt-2">View and manage all system appointments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="appointmentSearch" className="label">
          Search Appointments
        </label>
        <input
          id="appointmentSearch"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field max-w-md"
          placeholder="Search by #ID, doctor name, or patient name"
        />
      </div>

      <div className="card overflow-hidden">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No appointments found</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No matching appointments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={handleDateSortToggle}
                      className="flex items-center gap-1 uppercase tracking-wider hover:text-gray-700"
                    >
                      Date & Time
                      <span aria-hidden="true">{dateSortDirection === 'asc' ? '↑' : '↓'}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medical Concern
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{appointment.appointmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{appointment.appointmentDate}</div>
                      <div className="text-gray-500">
                        {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {appointment.medicalConcern || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
