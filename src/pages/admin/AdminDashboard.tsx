import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Stethoscope, Users, CreditCard, CalendarDays, UserCog } from 'lucide-react';
import { appointmentService, doctorService, userService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { StatTile } from '../../components/ui/StatTile';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatusBreakdownChart } from '../../components/charts/StatusBreakdownChart';
import { AppointmentsTrendChart } from '../../components/charts/AppointmentsTrendChart';
import { formatDateLocal, todayLocal } from '../../utils/dateFormat';
import type { AppointmentDto, DoctorDto, UserDto } from '../../types';

const UPCOMING_LIMIT = 5;
const TREND_DAYS = 7;

const getAppointmentDateTime = (appointment: AppointmentDto) =>
  new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();

export const AdminDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [appointmentsData, doctorsData, usersData] = await Promise.all([
          appointmentService.getAll(),
          doctorService.getAll(),
          userService.getAll(),
        ]);
        setAppointments(appointmentsData);
        setDoctors(doctorsData);
        setUsers(usersData);
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to load dashboard data');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const today = todayLocal();
    return {
      todayCount: appointments.filter((a) => a.appointmentDate === today).length,
      activeDoctors: doctors.filter((d) => d.status === 'Active').length,
      totalPatients: users.filter((u) => u.role === 'Patient').length,
      pendingPayment: appointments.filter((a) => a.status === 'Scheduled').length,
    };
  }, [appointments, doctors, users]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach((a) => counts.set(a.status, (counts.get(a.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
  }, [appointments]);

  const trend = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach((a) => counts.set(a.appointmentDate, (counts.get(a.appointmentDate) ?? 0) + 1));

    const days: { label: string; count: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateLocal(d);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count: counts.get(dateStr) ?? 0,
      });
    }
    return days;
  }, [appointments]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => (a.status === 'Scheduled' || a.status === 'Paid Scheduled') && getAppointmentDateTime(a) >= now)
      .sort((a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b))
      .slice(0, UPCOMING_LIMIT);
  }, [appointments]);

  const inactiveDoctors = useMemo(() => doctors.filter((d) => d.status === 'Inactive'), [doctors]);

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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage the hospital appointment system</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Today's Appointments" value={stats.todayCount} icon={CalendarClock} accent="primary" />
        <StatTile label="Active Doctors" value={stats.activeDoctors} icon={Stethoscope} subLabel={`${doctors.length} total`} accent="green" />
        <StatTile label="Total Patients" value={stats.totalPatients} icon={Users} accent="purple" />
        <StatTile label="Pending Payment" value={stats.pendingPayment} icon={CreditCard} accent="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment Status Breakdown</h3>
          <StatusBreakdownChart data={statusBreakdown} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointments - Last 7 Days</h3>
          <AppointmentsTrendChart data={trend} />
        </div>
      </div>

      {/* Upcoming appointments + shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
            <Link to="/admin/appointments" className="text-sm font-medium text-primary hover:underline">
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
                    <p className="font-medium text-gray-900">{a.patientName} with {a.doctorName}</p>
                    <p className="text-gray-500">{a.appointmentDate} · {a.startTime.substring(0, 5)} - {a.endTime.substring(0, 5)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage</h3>
          <div className="space-y-2">
            <Link to="/admin/appointments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
              <CalendarDays className="w-4 h-4 text-primary" /> Appointments
            </Link>
            <Link to="/admin/doctors" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
              <Stethoscope className="w-4 h-4 text-primary" /> Doctors
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
              <UserCog className="w-4 h-4 text-primary" /> Users
            </Link>
          </div>
        </div>
      </div>

      {inactiveDoctors.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
          {inactiveDoctors.length} doctor{inactiveDoctors.length > 1 ? 's are' : ' is'} currently marked Inactive:{' '}
          {inactiveDoctors.map((d) => d.name).join(', ')}
        </div>
      )}
    </div>
  );
};
