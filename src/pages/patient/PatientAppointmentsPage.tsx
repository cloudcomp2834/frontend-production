import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, medicalRecordService } from '../../services';
import { ApiError } from '../../services/api';
import type { AppointmentDto, MedicalRecordDto } from '../../types';

export const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Medical record modal state
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordDto | null>(null);
  const [loadingMedicalRecord, setLoadingMedicalRecord] = useState(false);

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

  const handleViewMedicalRecord = async (appointment: AppointmentDto) => {
    setSelectedAppointment(appointment);
    setShowMedicalRecordModal(true);
    setLoadingMedicalRecord(true);
    setError('');
    
    try {
      // For now, we need to find the medical record ID
      // Since backend doesn't have endpoint to get by appointmentId,
      // we'll fetch by the appointment's medical record (if we stored it)
      // For this demo, we'll show a message that medical records can be accessed
      // In a real scenario, you'd need backend to add GET /api/medical-records/by-appointment/{appointmentId}
      
      // Placeholder: In production, you would call:
      // const record = await medicalRecordService.getByAppointmentId(appointment.appointmentId);
      // setMedicalRecord(record);
      
      // For now, show a message
      setMedicalRecord(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to load medical record');
      }
    } finally {
      setLoadingMedicalRecord(false);
    }
  };

  const handleCloseMedicalRecordModal = () => {
    setShowMedicalRecordModal(false);
    setSelectedAppointment(null);
    setMedicalRecord(null);
  };

  const handleDownloadFile = async (recordFileId: number) => {
    try {
      const { fileUrl } = await medicalRecordService.getFilePresignedUrl(recordFileId);
      window.open(fileUrl, '_blank');
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.error || 'Failed to get download URL');
      }
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Medical Record - Appointment #{selectedAppointment.appointmentId}
                </h3>
                <button
                  onClick={handleCloseMedicalRecordModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {loadingMedicalRecord ? (
                <div className="text-center py-12">Loading medical record...</div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              ) : medicalRecord ? (
                <div className="space-y-4">
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
                        {medicalRecord.files.map((file) => (
                          <div
                            key={file.recordFileId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📋</div>
                  <p className="text-gray-600">
                    Medical record is not yet available for this appointment.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Currently, the backend does not support fetching medical records by appointment ID.
                    The doctor may not have completed the medical record yet, or you may need to contact support.
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
