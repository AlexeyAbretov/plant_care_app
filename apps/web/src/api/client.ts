import { apiBaseUrl } from '@config';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export async function parseApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };

    return body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(getApiUrl(path), init);

  if (!response.ok) {
    throw new ApiError(await parseApiError(response), response.status);
  }

  return (await response.json()) as T;
}
