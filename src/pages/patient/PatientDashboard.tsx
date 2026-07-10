import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Wallet } from 'lucide-react';
import { appointmentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { StatTile } from '../../components/ui/StatTile';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AppointmentDto } from '../../types';

const UPCOMING_LIMIT = 5;

const getAppointmentDateTime = (appointment: AppointmentDto) =>
  new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();

export const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await appointmentService.getMine();
        setAppointments(data);
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to load dashboard data');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => (a.status === 'Scheduled' || a.status === 'Paid Scheduled') && getAppointmentDateTime(a) >= now)
      .sort((a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b));
  }, [appointments]);

  const unpaidCount = useMemo(() => appointments.filter((a) => a.status === 'Scheduled').length, [appointments]);

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
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Pantai Hospital Portal</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatTile label="Upcoming Appointments" value={upcoming.length} icon={CalendarCheck} accent="primary" />
        <StatTile label="Unpaid Appointments" value={unpaidCount} icon={Wallet} accent="orange" />
      </div>

      {unpaidCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800 mb-6">
          You have {unpaidCount} unpaid appointment{unpaidCount > 1 ? 's' : ''}.{' '}
          <Link to="/patient/appointments" className="font-medium underline">Pay now</Link> to confirm your booking.
        </div>
      )}

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
          <Link to="/patient/book" className="text-sm font-medium text-primary hover:underline">
            + Book Appointment
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">No upcoming appointments</p>
            <Link to="/patient/book" className="btn-primary inline-block text-sm">Book an Appointment</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, UPCOMING_LIMIT).map((a) => (
              <Link
                key={a.appointmentId}
                to={a.status === 'Scheduled' ? `/patient/appointments/${a.appointmentId}/pay` : '/patient/appointments'}
                className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors duration-150"
              >
                <div>
                  <p className="font-medium text-gray-900">{a.doctorName}</p>
                  <p className="text-gray-500">{a.appointmentDate} · {a.startTime.substring(0, 5)} - {a.endTime.substring(0, 5)}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Need Help */}
      <div className="card bg-pantai-50 border border-pantai-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Book appointments with our specialist doctors</li>
          <li>• Upload payment receipts to confirm your bookings</li>
          <li>• Download invoices for your records</li>
          <li>• Contact hospital at +60123456789 for assistance</li>
        </ul>
      </div>
    </div>
  );
};
