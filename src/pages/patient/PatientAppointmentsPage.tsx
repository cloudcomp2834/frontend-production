import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, medicalRecordService } from '../../services';
import { ApiError } from '../../services/api';
import type { AppointmentDto, MedicalRecordDto } from '../../types';

type MedicalRecordState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; record: MedicalRecordDto }
  | { status: 'not_created' | 'appointment_not_found' | 'forbidden' | 'error'; message: string };

const formatTime = (time: string) => time.substring(0, 5);

const getApiMessage = (err: ApiError) => {
  if (typeof err.data === 'string') return err.data;
  return err.data?.error || err.data?.title || 'An unexpected error occurred';
};

export const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [medicalRecordState, setMedicalRecordState] = useState<MedicalRecordState>({ status: 'idle' });
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

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
        setError(getApiMessage(err) || 'Failed to load appointments');
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
        alert(getApiMessage(err) || 'Failed to cancel appointment');
      }
    }
  };

  const handleViewMedicalRecord = async (appointment: AppointmentDto) => {
    setSelectedAppointment(appointment);
    setShowMedicalRecordModal(true);
    setMedicalRecordState({ status: 'loading' });

    try {
      const record = await medicalRecordService.getByAppointmentId(appointment.appointmentId);
      setMedicalRecordState({ status: 'success', record });
    } catch (err) {
      if (err instanceof ApiError) {
        const message = getApiMessage(err);

        if (err.status === 404 && message.toLowerCase().includes('not found for this appointment')) {
          setMedicalRecordState({
            status: 'not_created',
            message: 'The doctor has not completed the medical record for this appointment yet.',
          });
          return;
        }

        if (err.status === 404) {
          setMedicalRecordState({
            status: 'appointment_not_found',
            message: 'Appointment not found.',
          });
          return;
        }

        if (err.status === 403) {
          setMedicalRecordState({
            status: 'forbidden',
            message: 'You do not have access to this medical record.',
          });
          return;
        }

        setMedicalRecordState({
          status: 'error',
          message: message || 'Failed to load medical record.',
        });
      } else {
        setMedicalRecordState({
          status: 'error',
          message: 'Failed to load medical record.',
        });
      }
    }
  };

  const handleCloseMedicalRecordModal = () => {
    setShowMedicalRecordModal(false);
    setSelectedAppointment(null);
    setMedicalRecordState({ status: 'idle' });
    setDownloadingFileId(null);
  };

  const handleDownloadFile = async (recordFileId: number) => {
    setDownloadingFileId(recordFileId);

    try {
      const { fileUrl } = await medicalRecordService.getFilePresignedUrl(recordFileId);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (err instanceof ApiError) {
        alert(getApiMessage(err) || 'Failed to get download URL');
      }
    } finally {
      setDownloadingFileId(null);
    }
  };

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">View appointments, payments, and completed medical records</p>
        </div>
        <Link to="/patient/book" className="btn-primary text-center">
          Book New Appointment
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-pantai-50 flex items-center justify-center text-pantai-700">
            <span className="text-2xl">+</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
          <p className="text-gray-600 mb-4">Book your first appointment with our specialist doctors.</p>
          <Link to="/patient/book" className="btn-primary inline-block">
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentId} className="card appointment-card-enter">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Appointment #{appointment.appointmentId}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium text-gray-900">{appointment.appointmentDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-medium text-gray-900">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Doctor</p>
                      <p className="font-medium text-gray-900">Doctor #{appointment.doctorId}</p>
                    </div>
                    {appointment.medicalConcern && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Medical Concern</p>
                        <p className="font-medium text-gray-900">{appointment.medicalConcern}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:min-w-44">
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
                  {appointment.status === 'Completed' && (
                    <button
                      onClick={() => handleViewMedicalRecord(appointment)}
                      className="btn-primary text-sm"
                    >
                      View Medical Record
                    </button>
                  )}
                  {appointment.status === 'Expired' && (
                    <Link to="/patient/book" className="btn-secondary text-sm text-center">
                      Book New Appointment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMedicalRecordModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-enter">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-pantai-700">Medical Record</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    Appointment #{selectedAppointment.appointmentId}
                  </h3>
                </div>
                <button
                  onClick={handleCloseMedicalRecordModal}
                  className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-2xl leading-none"
                  aria-label="Close medical record"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6">
              {medicalRecordState.status === 'loading' && (
                <div className="py-16 text-center">
                  <div className="mx-auto h-10 w-10 rounded-full border-4 border-pantai-100 border-t-pantai-600 animate-spin" />
                  <p className="mt-4 text-gray-600">Loading medical record...</p>
                </div>
              )}

              {(medicalRecordState.status === 'not_created' ||
                medicalRecordState.status === 'appointment_not_found' ||
                medicalRecordState.status === 'forbidden' ||
                medicalRecordState.status === 'error') && (
                <div className="rounded-lg border border-pantai-100 bg-pantai-50 p-6 text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-white flex items-center justify-center text-pantai-700 font-bold">
                    i
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {medicalRecordState.status === 'not_created'
                      ? 'Medical Record Not Yet Available'
                      : 'Unable to Show Medical Record'}
                  </h4>
                  <p className="text-gray-700">{medicalRecordState.message}</p>
                </div>
              )}

              {medicalRecordState.status === 'success' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Record ID</p>
                      <p className="font-semibold text-gray-900">#{medicalRecordState.record.medicalRecordId}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(medicalRecordState.record.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Appointment Date</p>
                      <p className="font-semibold text-gray-900">{selectedAppointment.appointmentDate}</p>
                    </div>
                  </div>

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Diagnosis</h4>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-gray-900">
                      {medicalRecordState.record.diagnose}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Doctor's Notes</h4>
                    <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-gray-900 whitespace-pre-wrap">
                      {medicalRecordState.record.note}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Attached Files</h4>
                      <p className="text-xs text-gray-500">Links are generated on click and expire after 15 minutes.</p>
                    </div>

                    {medicalRecordState.record.files.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-gray-500">
                        No supporting files were attached to this medical record.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {medicalRecordState.record.files.map((file) => (
                          <div
                            key={file.recordFileId}
                            className="rounded-lg border border-gray-200 p-4 hover:border-pantai-200 hover:bg-pantai-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{file.fileName}</p>
                                <p className="text-sm text-gray-500">{file.fileType}</p>
                              </div>
                              <button
                                onClick={() => handleDownloadFile(file.recordFileId)}
                                className="btn-primary text-sm shrink-0"
                                disabled={downloadingFileId === file.recordFileId}
                              >
                                {downloadingFileId === file.recordFileId ? 'Opening...' : 'Open'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button onClick={handleCloseMedicalRecordModal} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
