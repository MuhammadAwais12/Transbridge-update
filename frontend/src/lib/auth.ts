// Session state is tab-scoped: the token and the cached user both live in sessionStorage.
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): string | null {
  return sessionStorage.getItem(USER_KEY);
}

export function setStoredUser(user: unknown): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clears this tab's session, plus any keys left in localStorage by older builds. */
export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Seconds-since-epoch `exp` claim of a JWT, or null if it cannot be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// Helper to get auth token
export function getAuthHeaders(): { [key: string]: string } {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
