import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, medicalRecordService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { DoctorAppointmentDto } from '../../types';

export const DoctorAppointmentsPage = () => {
  const { doctorId } = useAuth();
  const toast = useToast();
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Complete appointment modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Completed' | 'No-show' | ''>('');
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
      // Filter to show only paid appointments
      const paidAppointments = data.filter(apt => apt.status === 'Paid Scheduled');
      setAppointments(paidAppointments.sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ));
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load appointments');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedStatus('');
    setDiagnose('');
    setNote('');
    setFiles([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointmentId(null);
    setSelectedStatus('');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointmentId || !selectedStatus) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      if (selectedStatus === 'Completed') {
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
        
        toast.success('Appointment completed successfully!');
      } else if (selectedStatus === 'No-show') {
        // Mark as no-show
        await appointmentService.markNoShow(selectedAppointmentId);
        toast.success('Appointment marked as no-show.');
      }
      
      // Reload appointments to reflect the change
      await loadAppointments();
      
      // Close modal
      handleCloseModal();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to process appointment');
      if (message) setError(message);
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const isSubmitDisabled = () => {
    if (!selectedStatus) return true;
    if (selectedStatus === 'Completed') {
      return !diagnose.trim() || !note.trim();
    }
    return false; // No-show can be submitted without additional fields
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
        <p className="text-gray-600 mt-2">View your paid scheduled patient appointments</p>
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
                    Concern
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Action
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
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {appointment.medicalConcern || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(appointment.appointmentId)}
                        className="inline-flex items-center justify-center p-2 text-pantai-600 hover:text-pantai-800 hover:bg-pantai-50 rounded-lg transition-colors"
                        title="Complete appointment"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Process Appointment
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as 'Completed' | 'No-show' | '')}
                      className="input-field w-full"
                      required
                    >
                      <option value="">-- Select Status --</option>
                      <option value="Completed">Completed</option>
                      <option value="No-show">No-show</option>
                    </select>
                  </div>

                  {/* Conditional Fields - Only show for "Completed" status */}
                  {selectedStatus === 'Completed' && (
                    <>
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
                    </>
                  )}

                  {/* Info message for No-show */}
                  {selectedStatus === 'No-show' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800">
                        ⚠️ Marking this appointment as "No-show" will finalize the status. This action cannot be undone.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || uploadingFiles || isSubmitDisabled()}
                  >
                    {submitting 
                      ? (uploadingFiles ? 'Uploading files...' : 'Processing...') 
                      : selectedStatus === 'Completed' 
                        ? 'Complete Appointment' 
                        : selectedStatus === 'No-show' 
                          ? 'Mark as No-Show' 
                          : 'Submit'}
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
