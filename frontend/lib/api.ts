import type { Hospital, AuthUser } from '../types/hospital';

const API = process.env.NEXT_PUBLIC_API_URL!;

// access token stored in memory only (not localStorage)
let accessToken: string | null = null;

export function setAccessToken(t: string | null) { accessToken = t; }
export function getAccessToken() { return accessToken; }

// ── Generic fetch with auto-refresh ──────────────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as any),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });

  // Token expired → try refresh
  if (res.status === 401 && accessToken) {
    const refreshed = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      accessToken = data.access_token;
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });
    } else {
      accessToken = null;
    }
  }
  return res;
}

// ── Hospitals ─────────────────────────────────────────────────────────────────
export async function fetchHospitals(
  lat: number, lng: number,
  radius = 5000,
  type = 'all',
  status = 'all'
) {
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius), type, status });
  const res = await fetch(`${API}/api/hospitals?${q}`); // public — no auth needed
  if (!res.ok) throw new Error('Failed to fetch hospitals');
  const data = await res.json();
  return data.data as Hospital[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function loginWithLine(code: string, redirectUri: string) {
  const res = await fetch(`${API}/api/auth/line`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) throw new Error('LINE login failed');
  const data = await res.json();
  accessToken = data.access_token;
  return data.user as AuthUser;
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  accessToken = null;
}

// ── Favorites ─────────────────────────────────────────────────────────────────
export async function getFavorites(): Promise<string[]> {
  const res = await apiFetch('/api/favorites');
  if (!res.ok) return [];
  const data = await res.json();
  return data.favorites;
}

export async function toggleFavoriteAPI(osmId: string): Promise<'added' | 'removed'> {
  const res = await apiFetch(`/api/favorites/${osmId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Favorite toggle failed');
  const data = await res.json();
  return data.action;
}