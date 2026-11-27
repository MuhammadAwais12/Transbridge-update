import { API_BASE_URL } from './apiBase';
import { clearSession, getAuthHeaders } from './auth';

/** Thrown for any non-2xx backend response. `body` is the parsed response (JSON or text). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends RequestInit {
  /**
   * Don't clear the session / redirect on 401. Use only where the backend returns 401
   * for a business error, e.g. POST /client/change-password with a wrong current password.
   */
  skipAuthRedirect?: boolean;
}

let redirecting = false;

function clearSessionAndRedirect() {
  // Same keys AuthContext.logout() clears. App renders the login form whenever no user is stored.
  clearSession();
  if (!redirecting) {
    redirecting = true;
    window.location.replace('/');
  }
}

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const b = body as { message?: unknown; error?: unknown; details?: { message?: unknown } };
    if (Array.isArray(b.message)) return b.message.join(', ');
    if (typeof b.message === 'string' && b.message) return b.message;
    if (typeof b.details?.message === 'string' && b.details.message) return b.details.message;
    if (typeof b.error === 'string' && b.error) return b.error;
  }
  if (typeof body === 'string' && body) return body;
  return `Request failed with status ${status}`;
}

/**
 * fetch() against the backend: prepends API_BASE_URL, adds the Bearer token,
 * sets JSON headers for string bodies, returns parsed JSON (null for an empty body),
 * throws ApiError on non-2xx, and on 401 clears the session and returns to login.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuthRedirect, ...init } = options;

  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    for (const [k, v] of Object.entries(getAuthHeaders())) headers.set(k, v);
  }
  // FormData / Blob bodies must keep the browser-generated Content-Type
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) clearSessionAndRedirect();
    throw new ApiError(res.status, errorMessage(res.status, body), body);
  }
  return body as T;
}
