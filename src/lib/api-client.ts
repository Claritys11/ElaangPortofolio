import { getStorageType } from '@/lib/storage-type';

function parsePath(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') {
    if (typeof window === 'undefined') {
      return input;
    }

    try {
      return new URL(input, window.location.origin).pathname;
    } catch {
      return input;
    }
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    if (typeof window === 'undefined') {
      return new URL(input.url).pathname;
    }

    return new URL(input.url, window.location.origin).pathname;
  }

  return null;
}

function shouldUseFirebaseClientApi(path: string | null): boolean {
  // Auth routes always go to the server. Everything else is handled by Firebase client in firebase mode.
  return (
    path !== null &&
    path.startsWith('/api/') &&
    !path.startsWith('/api/auth/') &&
    path !== '/api/public/profile' &&
    path !== '/api/admin/profile'
  );
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const path = parsePath(input);

  if (typeof window !== 'undefined' && getStorageType() === 'firebase' && shouldUseFirebaseClientApi(path)) {
    const { handleFirebaseClientRequest } = await import('@/lib/firebase-client-api');
    const firebaseClientResult = await handleFirebaseClientRequest<T>(input, init);
    if (firebaseClientResult.handled) {
      return firebaseClientResult.data as T;
    }
  }

  const response = await fetch(input, {
    credentials: 'same-origin',
    ...init,
    headers: {
      // Don't set Content-Type for FormData — browser sets it with the multipart boundary.
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}