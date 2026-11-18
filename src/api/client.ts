import type { User } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// The access token lives only in memory: it is never written to localStorage,
// so a script injected into the page has nothing persistent to steal. After a
// page reload it is re-created from the httpOnly refresh cookie.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Called when the session cannot be renewed (the app then shows the login page). */
let onSessionExpired: () => void = () => {};
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function parse(res: Response): Promise<any> {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  const details: { path: string; message: string }[] = data?.error?.details ?? [];
  const message = details.length
    ? details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join('; ')
    : (data?.error?.message ?? `Request failed (${res.status})`);
  throw new ApiError(res.status, message);
}

// Several requests can fail with 401 at once; they all wait for one refresh call.
let refreshing: Promise<User | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Returns null if not logged in. */
export function refreshSession(): Promise<User | null> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    .then(parse)
    .then((data: { user: User; accessToken: string }) => {
      accessToken = data.accessToken;
      return data.user;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {},
  isRetry = false,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Access token expired: renew it once and repeat the request.
  if (res.status === 401 && !isRetry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, options, true);
    onSessionExpired();
  }

  return parse(res);
}
