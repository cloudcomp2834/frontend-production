import { useState } from 'react';
import { Download } from 'lucide-react';
import { DatePicker } from '../../components/ui/DatePicker';
import { paymentReportService, isPaymentReportConfigured } from '../../services/paymentReportApi';
import { todayLocal } from '../../utils/dateFormat';

export const AdminPaymentReportsPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(todayLocal());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [reportUrl, setReportUrl] = useState('');

  const configured = isPaymentReportConfigured();

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      setError('Pick both a start and end date.');
      return;
    }

    setGenerating(true);
    setError('');
    setReportUrl('');
    try {
      const { reportUrl } = await paymentReportService.generateReport(fromDate, toDate);
      setReportUrl(reportUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate an on-demand export of payments received in a date range
        </p>
      </div>

      {!configured && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          The payment report service hasn't been deployed yet - set VITE_REPORTS_API_BASE_URL
          once payment-report-fn's API Gateway URL exists.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker id="fromDate" label="From" value={fromDate} onChange={setFromDate} />
          <DatePicker
            id="toDate"
            label="To"
            value={toDate}
            onChange={setToDate}
            minDate={fromDate || undefined}
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={generating || !configured}
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>

          {reportUrl && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
