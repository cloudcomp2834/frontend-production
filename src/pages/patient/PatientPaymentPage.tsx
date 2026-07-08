import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appointmentService, paymentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import type { AppointmentDto } from '../../types';

export const PatientPaymentPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const toast = useToast();
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    if (!appointmentId) return;

    try {
      const data = await appointmentService.getById(parseInt(appointmentId));
      setAppointment(data);

      // If already paid, fetch URLs
      if (data.status === 'Paid Scheduled') {
        await loadPaymentUrls();
      }
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load appointment');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentUrls = async () => {
    if (!appointmentId) return;

    try {
      const [invoiceData, receiptData] = await Promise.all([
        paymentService.getInvoiceUrl(parseInt(appointmentId)),
        paymentService.getReceiptUrl(parseInt(appointmentId)),
      ]);
      if (invoiceData.invoiceUrl) setInvoiceUrl(invoiceData.invoiceUrl);
      if (receiptData.receiptUrl) setReceiptUrl(receiptData.receiptUrl);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load payment details');
      if (message) toast.error(message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, and PDF files are accepted.');
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds the 10 MB limit.');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId || !selectedFile) return;

    setError('');
    setUploading(true);

    try {
      const result = await paymentService.uploadReceipt(parseInt(appointmentId), selectedFile);
      
      // Set URLs from response
      if (result.invoicePresignedUrl) setInvoiceUrl(result.invoicePresignedUrl);
      if (result.receiptPresignedUrl) setReceiptUrl(result.receiptPresignedUrl);

      // Reload appointment to show updated status
      await loadAppointment();
      
      // Show success message
      toast.success('Payment receipt uploaded successfully! Your appointment is now confirmed.');
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to upload receipt');
      if (message) setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Appointment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="text-gray-600 mt-2">Appointment #{appointment.appointmentId}</p>
      </div>

      {/* Appointment Details */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Date:</p>
            <p className="font-medium">{appointment.appointmentDate}</p>
          </div>
          <div>
            <p className="text-gray-600">Time:</p>
            <p className="font-medium">
              {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Status:</p>
            <p className={`font-medium ${appointment.status === 'Paid Scheduled' ? 'text-green-600' : 'text-blue-600'}`}>
              {appointment.status}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Doctor:</p>
            <p className="font-medium">Doctor #{appointment.doctorId}</p>
          </div>
        </div>
      </div>

      {/* Upload Receipt Form (only if not paid) */}
      {appointment.status === 'Scheduled' && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Payment Receipt</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Make payment via bank transfer to: <strong>Hospital Account 123-456-789</strong></li>
              <li>Take a screenshot or save the payment receipt</li>
              <li>Upload the receipt below (JPEG, PNG, or PDF, max 10MB)</li>
              <li>Your appointment will be confirmed once uploaded</li>
            </ol>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="receipt" className="label">
                Select Receipt File <span className="text-red-500">*</span>
              </label>
              <input
                id="receipt"
                type="file"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
                className="input-field"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Uploading...' : 'Upload Receipt & Confirm Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Payment Confirmed - Show Documents */}
      {appointment.status === 'Paid Scheduled' && (
        <div className="card">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">✓ Payment Confirmed</h3>
            <p className="text-sm text-green-700">
              Your payment has been received and your appointment is confirmed.
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-4">Download Documents</h2>
          
          <div className="space-y-3">
            {invoiceUrl && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Invoice (PDF)</p>
                  <p className="text-sm text-gray-600">Auto-generated invoice for your appointment</p>
                </div>
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm"
                >
                  Download Invoice
                </a>
              </div>
            )}

            {receiptUrl && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Payment Receipt</p>
                  <p className="text-sm text-gray-600">Your uploaded payment receipt</p>
                </div>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm"
                >
                  View Receipt
                </a>
              </div>
            )}

            <p className="text-sm text-amber-600 text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⓘ Download links expire after 15 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Cancelled Notice */}
      {appointment.status === 'Cancelled' && (
        <div className="card">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Appointment Cancelled</h3>
            <p className="text-sm text-red-700">
              This appointment has been cancelled. No payment is required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
