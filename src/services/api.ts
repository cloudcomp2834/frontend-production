import { triggerForceLogout, SESSION_EXPIRED_MESSAGE } from '../contexts/authBus';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://13-239-141-189.sslip.io';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(`API Error: ${status}`);
    this.status = status;
    this.data = data;
  }
}

interface ApiFetchConfig {
  // Set true for endpoints that are expected to be called without an existing
  // session (e.g. login) - a 401 there means "wrong credentials", not "your
  // session expired", so it must not clear storage / show the session-expired
  // toast / force a redirect. The real error body is returned to the caller.
  suppressSessionHandling?: boolean;
}

// Guards against firing the "session expired" toast + redirect more than once
// when several requests happen to 401 around the same time.
let sessionExpiredHandled = false;

export const apiFetch = async (path: string, options: RequestInit = {}, config: ApiFetchConfig = {}) => {
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

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, { error: 'Unable to reach the server. Please check your connection and try again.' });
  }

  // Handle 401 - an authenticated request was rejected, meaning the session
  // is no longer valid. Endpoints marked suppressSessionHandling (login) skip
  // this and fall through to the normal error handling below instead, so the
  // real backend error (e.g. "Invalid username or password") reaches the caller.
  if (res.status === 401 && !config.suppressSessionHandling) {
    if (!sessionExpiredHandled) {
      sessionExpiredHandled = true;
      triggerForceLogout(SESSION_EXPIRED_MESSAGE);
    }
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

interface ApiErrorsDict {
  [field: string]: string[];
}

// Extracts a user-facing message from a caught error, or null if the caller
// should show nothing (the global session-expired toast already covers it).
export const getErrorMessage = (err: unknown, fallback: string): string | null => {
  if (!(err instanceof ApiError)) return fallback;

  const data = err.data;

  // The global 401 handler (services/api.ts's own session-expiry branch,
  // triggered via authBus) already shows a toast and redirects - don't
  // duplicate it. Scoped to the exact synthesized sentinel, not every 401,
  // so login's own wrong-password 401 (a different message, sent via
  // suppressSessionHandling) still displays normally instead of being eaten.
  if (err.status === 401 && data?.error === 'Session expired') return null;

  if (data && typeof data === 'object' && typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
    const firstArray = Object.values(data.errors as ApiErrorsDict).find(
      (v) => Array.isArray(v) && v.length > 0
    );
    if (firstArray && typeof firstArray[0] === 'string') return firstArray[0];
  }

  if (err.status === 403) return "You don't have permission to do this.";
  if (err.status === 404) return 'The requested item could not be found.';

  return fallback;
};

// Helper to build query string
export const buildQueryString = (params: Record<string, any>): string => {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null);
  if (filtered.length === 0) return '';
  return '?' + filtered.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};
