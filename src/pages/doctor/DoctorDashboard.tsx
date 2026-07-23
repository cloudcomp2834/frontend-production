import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, scheduleService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { StatTile } from '../../components/ui/StatTile';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { todayLocal, formatDateLocal, startOfWeek, endOfWeek } from '../../utils/dateFormat';
import type { DoctorAppointmentDto, DoctorScheduleDto } from '../../types';

const UPCOMING_LIMIT = 5;

const getAppointmentDateTime = (appointment: DoctorAppointmentDto) =>
  new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();

export const DoctorDashboard = () => {
  const { doctorId } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    const load = async () => {
      try {
        const [appointmentsData, schedulesData] = await Promise.all([
          appointmentService.getDoctorAppointments(doctorId),
          scheduleService.getSchedules(doctorId),
        ]);
        setAppointments(appointmentsData);
        setSchedules(schedulesData);
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to load dashboard data');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  const stats = useMemo(() => {
    const today = todayLocal();
    const weekStart = formatDateLocal(startOfWeek(new Date()));
    const weekEnd = formatDateLocal(endOfWeek(new Date()));

    return {
      todayCount: appointments.filter((a) => a.appointmentDate === today && a.status === 'Paid Scheduled').length,
      weekSlots: schedules.filter((s) => s.date >= weekStart && s.date <= weekEnd).length,
    };
  }, [appointments, schedules]);

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status === 'Paid Scheduled' && getAppointmentDateTime(a) >= now)
    .sort((a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b))
    .slice(0, UPCOMING_LIMIT);

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
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your schedule and appointments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatTile label="Today's Appointments" value={stats.todayCount} icon={CalendarClock} accent="primary" />
        <StatTile label="This Week's Scheduled Slots" value={stats.weekSlots} icon={Clock} accent="green" />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
          <Link to="/doctor/appointments" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No upcoming appointments</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.appointmentId} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">{a.patientName} · {a.appointmentType}</p>
                  <p className="text-gray-500">{a.appointmentDate} · {a.startTime.substring(0, 5)} - {a.endTime.substring(0, 5)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
