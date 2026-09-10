// During local dev on a physical device, 'localhost' refers to the PHONE,
// not your computer — swap this for your machine's LAN IP (e.g.
// 'http://192.168.1.23:3001', find it with `ipconfig getifaddr en0` on
// Mac) when testing on a real device via Expo Go. The iOS Simulator and
// Android Emulator have their own quirks too: iOS Simulator can use
// localhost directly; Android Emulator needs 10.0.2.2 instead of localhost.
export const API_URL = "http://localhost:3001";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Same as apiFetch but attaches a bearer token, for any endpoint behind
// JwtAuthGuard on the backend (e.g. /users/me, session create/join/leave).
export async function authedFetch(
  path: string,
  token: string,
  options: RequestInit = {},
) {
  return apiFetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export interface AuthResponse {
  accessToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  bio?: string;
  favoriteGames: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export function registerUser(input: {
  email: string;
  password: string;
  name: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<AuthResponse>;
}

export function loginUser(input: { email: string; password: string }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<AuthResponse>;
}

export function getCurrentUser(token: string) {
  return authedFetch("/users/me", token) as Promise<PublicUser>;
}

export type SessionRepeat = "none" | "weekly" | "biweekly";

export interface Session {
  id: string;
  games: string[];
  description?: string;
  location: string;
  startTime: string;
  maxPlayers: number;
  repeats: SessionRepeat;
  owner: PublicUser;
  participants: PublicUser[];
  createdAt: string;
  updatedAt: string;
}

export function listSessions(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : "";
  return apiFetch(`/sessions${query}`) as Promise<Session[]>;
}

export function listMySessions(token: string) {
  return authedFetch("/sessions/mine", token) as Promise<Session[]>;
}

export function createSession(
  token: string,
  input: {
    games: string[];
    description?: string;
    location: string;
    startTime: string;
    maxPlayers: number;
    repeats?: SessionRepeat;
  },
) {
  return authedFetch("/sessions", token, {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<Session>;
}

export function joinSession(token: string, sessionId: string) {
  return authedFetch(`/sessions/${sessionId}/join`, token, {
    method: "POST",
  }) as Promise<Session>;
}

export function leaveSession(token: string, sessionId: string) {
  return authedFetch(`/sessions/${sessionId}/leave`, token, {
    method: "POST",
  }) as Promise<Session>;
}
