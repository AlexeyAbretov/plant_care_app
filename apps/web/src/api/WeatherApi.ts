import type { WeatherQuery, WeatherSnapshot } from '@types';

import { type ApiClient, apiClient } from './ApiClient';

export class WeatherApi {
  constructor(private readonly client: ApiClient) {}

  async get(params?: WeatherQuery): Promise<WeatherSnapshot> {
    return this.client.fetchJson<WeatherSnapshot>(this.weatherPath(params));
  }

  private weatherPath(params?: WeatherQuery): string {
    const searchParams = new URLSearchParams();

    if (params?.city !== undefined && params.city !== '') {
      searchParams.set('city', params.city);
    }

    if (params?.lat !== undefined && params.lon !== undefined) {
      searchParams.set('lat', String(params.lat));
      searchParams.set('lon', String(params.lon));
    }

    const query = searchParams.toString();

    return query === '' ? '/api/weather' : `/api/weather?${query}`;
  }
}

export const weatherApi = new WeatherApi(apiClient);
