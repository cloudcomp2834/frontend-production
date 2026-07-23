// Separate from services/api.ts on purpose: payment-report-fn lives behind its own
// API Gateway URL (not the main backend), so it needs its own base URL and must NOT
// share apiFetch's 401 -> force-logout handling, since a rejected request here says
// nothing about whether the main app session is still valid.

const REPORTS_API_BASE_URL = import.meta.env.VITE_REPORTS_API_BASE_URL;

export interface PaymentReportResponse {
  reportUrl: string;
}

export const isPaymentReportConfigured = (): boolean => Boolean(REPORTS_API_BASE_URL);

export const paymentReportService = {
  generateReport: async (from: string, to: string): Promise<PaymentReportResponse> => {
    if (!REPORTS_API_BASE_URL) {
      throw new Error('The payment report service has not been deployed yet.');
    }

    const token = localStorage.getItem('token');
    const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    let res: Response;
    try {
      res = await fetch(`${REPORTS_API_BASE_URL}${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      throw new Error('Unable to reach the report service. Please check your connection and try again.');
    }

    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const message = typeof data === 'object' && data?.error ? data.error : 'Failed to generate report.';
      throw new Error(message);
    }

    return data as PaymentReportResponse;
  },
};
