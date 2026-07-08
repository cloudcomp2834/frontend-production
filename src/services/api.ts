import { emitToast } from '../components/ui/toastBus';

const BASE_URL = 'http://localhost:5024';

export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(status: number, data: any) {
    super(`API Error: ${status}`);
    this.status = status;
    this.data = data;
  }
}

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 - session expired
  if (res.status === 401) {
    localStorage.clear();
    emitToast('error', 'Your session has expired. Please log in again.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
    throw new ApiError(401, { error: 'Session expired' });
  }

  // Parse response
  const contentType = res.headers.get('content-type');
  let data;
  if (contentType?.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // Throw error for non-2xx status
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return { status: res.status, data };
};

// Helper to build query string
export const buildQueryString = (params: Record<string, any>): string => {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null);
  if (filtered.length === 0) return '';
  return '?' + filtered.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};
