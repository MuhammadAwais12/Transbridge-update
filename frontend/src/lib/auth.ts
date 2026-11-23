// Helper to get auth token
export function getAuthHeaders(): { [key: string]: string } {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
} 