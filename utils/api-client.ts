import Constants from 'expo-constants';

export class AuthError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Creates a thin fetch wrapper for the Peachy REST API.
 * Accepts a token getter so it doesn't depend on auth-context directly
 * (avoids circular dependencies).
 */
export function createApiClient(getIdToken: () => Promise<string | null>) {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const baseUrl = (extra.apiUrl ?? '').replace(/\/$/, '');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await getIdToken();
    if (!token) throw new AuthError();

    // Normalize path: strip leading slash (prevents double-slash) and reject traversal sequences
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    if (/\.\./.test(normalizedPath)) {
      throw new ApiError(`Invalid API path: ${normalizedPath}`, 400);
    }

    const response = await fetch(`${baseUrl}/${normalizedPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 401) throw new AuthError();

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      // Only surface server error text for client errors (4xx). Server errors (5xx)
      // may contain internal details (ARNs, table names, stack traces) so we keep
      // the generic message to avoid information disclosure.
      if (response.status >= 400 && response.status < 500) {
        try {
          const errorBody = await response.json() as Record<string, unknown>;
          if (typeof errorBody.message === 'string') message = errorBody.message;
          else if (typeof errorBody.error === 'string') message = errorBody.error;
        } catch {
          // ignore JSON parse errors on error body
        }
      }
      throw new ApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    try {
      return await response.json() as T;
    } catch (err) {
      throw new ApiError(
        `Failed to parse response: ${err instanceof Error ? err.message : 'invalid JSON'}`,
        response.status
      );
    }
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    del: <T = void>(path: string) => request<T>('DELETE', path),
  };
}
