import { apiBaseUrl } from '@config';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);

    return (await response.json()) as T;
  }

  async request(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(this.url(path), init);

    if (!response.ok) {
      throw new ApiError(await this.errorMessage(response), response.status);
    }

    return response;
  }

  private async errorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: string };

      return body.error ?? response.statusText;
    } catch {
      return response.statusText;
    }
  }
}

export const apiClient = new ApiClient(apiBaseUrl);
