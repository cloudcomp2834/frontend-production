import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services';
import { ApiError } from '../../services/api';
import type { AppointmentDto } from '../../types';

export const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getMine();
      setAppointments(data.sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentService.cancel(appointmentId);
      await loadAppointments();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.error || 'Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Paid Scheduled':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">View and manage your appointments</p>
        </div>
        <Link to="/patient/book" className="btn-primary">
          + Book New Appointment
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
          <p className="text-gray-600 mb-4">Book your first appointment with our specialist doctors</p>
          <Link to="/patient/book" className="btn-primary inline-block">
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentId} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Appointment #{appointment.appointmentId}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date:</p>
                      <p className="font-medium text-gray-900">{appointment.appointmentDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time:</p>
                      <p className="font-medium text-gray-900">
                        {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Doctor:</p>
                      <p className="font-medium text-gray-900">Doctor #{appointment.doctorId}</p>
                    </div>
                    {appointment.medicalConcern && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Medical Concern:</p>
                        <p className="font-medium text-gray-900">{appointment.medicalConcern}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col space-y-2">
                  {appointment.status === 'Scheduled' && (
                    <>
                      <Link
                        to={`/patient/appointments/${appointment.appointmentId}/pay`}
                        className="btn-primary text-sm text-center"
                      >
                        Pay Now
                      </Link>
                      <button
                        onClick={() => handleCancel(appointment.appointmentId)}
                        className="btn-danger text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appointment.status === 'Paid Scheduled' && (
                    <Link
                      to={`/patient/appointments/${appointment.appointmentId}/pay`}
                      className="btn-secondary text-sm text-center"
                    >
                      View Receipt & Invoice
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
