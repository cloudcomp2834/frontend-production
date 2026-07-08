import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, medicalRecordService } from '../../services';
import { ApiError } from '../../services/api';
import type { DoctorAppointmentDto } from '../../types';

export const DoctorAppointmentsPage = () => {
  const { doctorId } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Complete appointment modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [diagnose, setDiagnose] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [completing, setCompleting] = useState(false);
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
        setError(err.data?.error || 'Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setDiagnose('');
    setNote('');
    setFiles([]);
    setShowCompleteModal(true);
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedAppointmentId(null);
    setDiagnose('');
    setNote('');
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate file types
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
      
      if (invalidFiles.length > 0) {
        setError('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are accepted.');
        return;
      }
      
      // Validate file sizes (10MB max)
      const oversizedFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
      
      if (oversizedFiles.length > 0) {
        setError('File size exceeds the 10 MB limit.');
        return;
      }
      
      setFiles(selectedFiles);
      setError('');
    }
  };

  const handleCompleteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointmentId) return;
    
    setCompleting(true);
    setError('');
    
    try {
      // Step 1: Complete appointment and create medical record
      const response = await appointmentService.complete(selectedAppointmentId, {
        diagnose: diagnose.trim(),
        note: note.trim(),
      });
      
      // Step 2: Upload files if any
      if (files.length > 0) {
        setUploadingFiles(true);
        await medicalRecordService.uploadFiles(response.medicalRecord.medicalRecordId, files);
      }
      
      // Reload appointments to reflect the change
      await loadAppointments();
      
      // Close modal and show success
      handleCloseCompleteModal();
      alert('Appointment completed successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to complete appointment');
      }
    } finally {
      setCompleting(false);
      setUploadingFiles(false);
    }
  };

  const handleMarkNoShow = async (appointmentId: number) => {
    if (!confirm('Mark this appointment as no-show? This action cannot be undone.')) {
      return;
    }
    
    try {
      await appointmentService.markNoShow(appointmentId);
      await loadAppointments();
      alert('Appointment marked as no-show.');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Failed to mark as no-show');
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

  const getPaymentStatusColor = (status: string) => {
    return status === 'Paid' ? 'text-green-600' : 'text-orange-600';
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
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">View your scheduled patient appointments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No appointments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Concern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{appointment.appointmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{appointment.appointmentDate}</div>
                      <div className="text-gray-500">
                        {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.appointmentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={getPaymentStatusColor(appointment.paymentStatus)}>
                        {appointment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {appointment.medicalConcern || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {appointment.status === 'Paid Scheduled' && (
                        <>
                          <button
                            onClick={() => handleOpenCompleteModal(appointment.appointmentId)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleMarkNoShow(appointment.appointmentId)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            No-Show
                          </button>
                        </>
                      )}
                      {appointment.status === 'Completed' && (
                        <span className="text-gray-400">Completed</span>
                      )}
                      {(appointment.status === 'No-show' || appointment.status === 'Cancelled' || appointment.status === 'Expired') && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Appointment Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Complete Appointment
              </h3>

              <form onSubmit={handleCompleteSubmit}>
                <div className="space-y-4">
                  {/* Diagnose Field */}
                  <div>
                    <label htmlFor="diagnose" className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnose <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="diagnose"
                      value={diagnose}
                      onChange={(e) => setDiagnose(e.target.value)}
                      className="input-field w-full"
                      placeholder="e.g., Upper respiratory tract infection"
                      required
                    />
                  </div>

                  {/* Note Field */}
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                      Note <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="input-field w-full"
                      rows={4}
                      placeholder="Rest, hydration, follow-up in 1 week if symptoms persist..."
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                      Supporting Files (Optional)
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
                      Accepted formats: JPEG, PNG, WEBP, PDF. Max size: 10MB per file.
                    </p>
                    {files.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">Selected files:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {files.map((file, idx) => (
                            <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseCompleteModal}
                    className="btn-secondary"
                    disabled={completing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={completing || uploadingFiles}
                  >
                    {completing ? (uploadingFiles ? 'Uploading files...' : 'Completing...') : 'Complete Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
