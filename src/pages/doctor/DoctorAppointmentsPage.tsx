import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, medicalRecordService } from '../../services';
import { ApiError } from '../../services/api';
import type { DoctorAppointmentDto } from '../../types';

const finalStatuses = ['Completed', 'No-show', 'Expired', 'Cancelled'];
const actionableStatuses = ['Scheduled', 'Paid Scheduled'];
const validFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const maxFileSize = 10 * 1024 * 1024;

const formatTime = (time: string) => time.substring(0, 5);

const getApiMessage = (err: ApiError) => {
  if (typeof err.data === 'string') return err.data;
  return err.data?.error || err.data?.title || 'An unexpected error occurred';
};

const getAppointmentStart = (appointment: DoctorAppointmentDto) => {
  const time = appointment.startTime.length === 5 ? `${appointment.startTime}:00` : appointment.startTime;
  return new Date(`${appointment.appointmentDate}T${time}`);
};

const hasAppointmentStarted = (appointment: DoctorAppointmentDto) => {
  const start = getAppointmentStart(appointment);
  return Number.isNaN(start.getTime()) ? true : Date.now() > start.getTime();
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'Paid Scheduled':
      return 'bg-green-100 text-green-800';
    case 'Completed':
      return 'bg-purple-100 text-purple-800';
    case 'No-show':
      return 'bg-orange-100 text-orange-800';
    case 'Expired':
      return 'bg-gray-100 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const DoctorAppointmentsPage = () => {
  const { doctorId } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointmentDto | null>(null);
  const [diagnose, setDiagnose] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    }
  }, [doctorId]);

  const loadAppointments = async () => {
    if (!doctorId) return;

    try {
      const data = await appointmentService.getDoctorAppointments(doctorId);
      setAppointments(data.sort((a, b) =>
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getApiMessage(err) || 'Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (appointment: DoctorAppointmentDto) => {
    setSelectedAppointment(appointment);
    setDiagnose('');
    setNote('');
    setFiles([]);
    setError('');
    setSuccessMessage('');
    setShowCompleteModal(true);
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedAppointment(null);
    setDiagnose('');
    setNote('');
    setFiles([]);
    setUploadingFiles(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const invalidFiles = selectedFiles.filter(file => !validFileTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are accepted.');
      e.target.value = '';
      return;
    }

    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setError('File size exceeds the 10 MB limit.');
      e.target.value = '';
      return;
    }

    setFiles(selectedFiles);
    setError('');
  };

  const handleCompleteSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedAppointment) return;

    if (!hasAppointmentStarted(selectedAppointment)) {
      setError('This appointment cannot be completed before its scheduled start time.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await appointmentService.complete(selectedAppointment.appointmentId, {
        diagnose: diagnose.trim(),
        note: note.trim(),
      });

      if (files.length > 0) {
        setUploadingFiles(true);
        await medicalRecordService.uploadFiles(response.medicalRecord.medicalRecordId, files);
      }

      setSuccessMessage('Appointment completed and medical record created.');
      await loadAppointments();
      handleCloseCompleteModal();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getApiMessage(err) || 'Failed to complete appointment');
      }
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const handleNoShow = async (appointment: DoctorAppointmentDto) => {
    if (!confirm('Mark this appointment as no-show? This final status cannot be changed afterward.')) return;

    setError('');
    setSuccessMessage('');

    try {
      await appointmentService.markNoShow(appointment.appointmentId);
      setSuccessMessage(`Appointment #${appointment.appointmentId} marked as no-show.`);
      await loadAppointments();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getApiMessage(err) || 'Failed to mark appointment as no-show');
      }
    }
  };

  const canActOn = (appointment: DoctorAppointmentDto) => actionableStatuses.includes(appointment.status);

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
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">Complete appointments, create medical records, and mark no-shows.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      <div className="card">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concern</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => {
                  const started = hasAppointmentStarted(appointment);
                  const finalStatus = finalStatuses.includes(appointment.status);

                  return (
                    <tr key={appointment.appointmentId} className="hover:bg-gray-50 appointment-card-enter">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{appointment.appointmentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{appointment.appointmentDate}</div>
                        <div className="text-gray-500">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.appointmentType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="line-clamp-2">{appointment.medicalConcern || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {finalStatus ? (
                          <span className="text-sm text-gray-500">Final</span>
                        ) : canActOn(appointment) ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenCompleteModal(appointment)}
                              className="btn-primary text-sm"
                              disabled={!started}
                              title={started ? 'Complete appointment' : 'Available after the appointment start time'}
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleNoShow(appointment)}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                            >
                              No-show
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-enter">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-pantai-700">Complete Appointment</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    Appointment #{selectedAppointment.appointmentId}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAppointment.patientName} · {selectedAppointment.appointmentDate} · {formatTime(selectedAppointment.startTime)}
                  </p>
                </div>
                <button
                  onClick={handleCloseCompleteModal}
                  className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-2xl leading-none"
                  aria-label="Close complete appointment form"
                  disabled={submitting}
                >
                  x
                </button>
              </div>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="diagnose" className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="diagnose"
                    value={diagnose}
                    onChange={(e) => setDiagnose(e.target.value)}
                    className="input-field w-full"
                    rows={3}
                    required
                    placeholder="Enter patient diagnosis"
                  />
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field w-full"
                    rows={5}
                    required
                    placeholder="Treatment plan, recommendations, and follow-up instructions"
                  />
                </div>

                <div>
                  <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                    Supporting Files
                  </label>
                  <input
                    type="file"
                    id="files"
                    onChange={handleFileChange}
                    className="input-field w-full"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WEBP, or PDF. Max 10 MB per file.
                  </p>

                  {files.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {files.map((file) => (
                        <div key={`${file.name}-${file.size}`} className="rounded-lg border border-gray-200 p-3 text-sm">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseCompleteModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || uploadingFiles || !diagnose.trim() || !note.trim()}
                >
                  {submitting
                    ? (uploadingFiles ? 'Uploading files...' : 'Completing...')
                    : 'Complete Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
