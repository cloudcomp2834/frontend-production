import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, medicalRecordService } from '../../services';
import { apiFetch, ApiError, getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AppointmentDto, MedicalRecordDto } from '../../types';

type MedicalRecordStatus = 'idle' | 'loading' | 'success' | 'not_created' | 'error';

export const PatientAppointmentsPage = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Medical record modal state
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordDto | null>(null);
  const [medicalRecordStatus, setMedicalRecordStatus] = useState<MedicalRecordStatus>('idle');
  const [medicalRecordError, setMedicalRecordError] = useState('');

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
      const message = getErrorMessage(err, 'Failed to load appointments');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!(await confirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      danger: true,
    }))) return;

    try {
      await appointmentService.cancel(appointmentId);
      await loadAppointments();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to cancel appointment');
      if (message) toast.error(message);
    }
  };

  const handleViewMedicalRecord = async (appointment: AppointmentDto) => {
    setSelectedAppointment(appointment);
    setMedicalRecord(null);
    setMedicalRecordError('');
    setMedicalRecordStatus('loading');
    setShowMedicalRecordModal(true);
    requestAnimationFrame(() => setModalVisible(true));

    try {
      const { data } = await apiFetch(`/api/medical-records/appointment/${appointment.appointmentId}`);
      setMedicalRecord(data);
      setMedicalRecordStatus('success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && String(err.data?.error || '').includes('not found for this appointment')) {
        setMedicalRecordStatus('not_created');
      } else {
        setMedicalRecordError(getErrorMessage(err, 'Failed to load medical record') || 'Failed to load medical record');
        setMedicalRecordStatus('error');
      }
    }
  };

  const handleCloseMedicalRecordModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setShowMedicalRecordModal(false);
      setSelectedAppointment(null);
      setMedicalRecord(null);
      setMedicalRecordStatus('idle');
    }, 200);
  };

  const handleDownloadFile = async (recordFileId: number) => {
    try {
      const { fileUrl } = await medicalRecordService.getFilePresignedUrl(recordFileId);
      window.open(fileUrl, '_blank');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to get download URL');
      if (message) toast.error(message);
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
      <style>{`
        @keyframes mrFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mrFadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .mr-fade-in { animation: mrFadeIn 200ms ease-out both; }
        .mr-fade-in-up { animation: mrFadeInUp 250ms ease-out both; }
      `}</style>
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
                    <StatusBadge status={appointment.status} />
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
                  {appointment.status === 'Completed' && (
                    <button
                      onClick={() => handleViewMedicalRecord(appointment)}
                      className="btn-primary text-sm"
                    >
                      View Medical Record
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medical Record Modal */}
      {showMedicalRecordModal && selectedAppointment && (
        <div
          className={`fixed inset-0 bg-gray-600 overflow-y-auto h-full w-full z-50 flex items-center justify-center transition-opacity duration-200 ease-out ${
            modalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={handleCloseMedicalRecordModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 transition-all duration-200 ease-out ${
              modalVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Medical Record - Appointment #{selectedAppointment.appointmentId}
                </h3>
                <button
                  onClick={handleCloseMedicalRecordModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors duration-150"
                >
                  ×
                </button>
              </div>

              {medicalRecordStatus === 'loading' && (
                <div className="text-center py-12 animate-pulse">
                  <div className="mx-auto h-8 w-8 rounded-full border-4 border-blue-100 border-t-primary animate-spin mb-3" />
                  <p className="text-gray-500">Loading medical record...</p>
                </div>
              )}

              {medicalRecordStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mr-fade-in">
                  {medicalRecordError}
                </div>
              )}

              {medicalRecordStatus === 'success' && medicalRecord && (
                <div className="space-y-4 mr-fade-in">
                  {/* Medical Record Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Date Created:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(medicalRecord.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Appointment Date:</p>
                        <p className="font-medium text-gray-900">
                          {selectedAppointment.appointmentDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnose */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Diagnose:</h4>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                      {medicalRecord.diagnose}
                    </p>
                  </div>

                  {/* Note */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Doctor's Notes:</h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-lg whitespace-pre-wrap">
                      {medicalRecord.note}
                    </p>
                  </div>

                  {/* Attached Files */}
                  {medicalRecord.files && medicalRecord.files.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Supporting Documents:</h4>
                      <div className="space-y-2">
                        {medicalRecord.files.map((file, index) => (
                          <div
                            key={file.recordFileId}
                            style={{ animationDelay: `${index * 60}ms` }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mr-fade-in-up hover:bg-gray-100 transition-colors duration-150"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{file.fileName}</p>
                              <p className="text-sm text-gray-500">{file.fileType}</p>
                            </div>
                            <button
                              onClick={() => handleDownloadFile(file.recordFileId)}
                              className="btn-primary text-sm"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ⓘ Download links are valid for 15 minutes.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {medicalRecordStatus === 'not_created' && (
                <div className="text-center py-12 mr-fade-in">
                  <div className="text-gray-400 text-5xl mb-4">📋</div>
                  <p className="text-gray-600">
                    Medical record is not yet available for this appointment.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    The doctor has not completed the medical record for this appointment yet.
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseMedicalRecordModal}
                  className="btn-secondary"
                >
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
