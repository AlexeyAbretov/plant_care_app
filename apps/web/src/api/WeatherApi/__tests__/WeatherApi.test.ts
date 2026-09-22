import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '../../ApiClient';
import { WeatherApi, weatherApi } from '../WeatherApi';

const createApi = () => {
  const fetchJson = vi.fn().mockResolvedValue({ locationLabel: 'Москва' });
  const client = { fetchJson } as unknown as ApiClient;

  return { api: new WeatherApi(client), fetchJson };
};

describe('WeatherApi', () => {
  it('экспортирует клиент по умолчанию', () => {
    expect(weatherApi).toBeInstanceOf(WeatherApi);
  });

  it('запрашивает погоду без параметров, по городу и координатам', async () => {
    const { api, fetchJson } = createApi();

    await api.get();
    await api.get({});
    await api.get({ city: '' });
    await api.get({ city: 'Санкт-Петербург' });
    await api.get({ lat: 55.75 });
    await api.get({ lat: 0, lon: 0 });
    await api.get({ city: 'Казань', lat: 55.7, lon: 49.1 });

    expect(fetchJson.mock.calls.map((call) => call[0])).toEqual([
      '/api/weather',
      '/api/weather',
      '/api/weather',
      `/api/weather?${new URLSearchParams({ city: 'Санкт-Петербург' })}`,
      '/api/weather',
      `/api/weather?${new URLSearchParams({ lat: '0', lon: '0' })}`,
      `/api/weather?${new URLSearchParams({
        city: 'Казань',
        lat: '55.7',
        lon: '49.1',
      })}`,
    ]);
  });
});
