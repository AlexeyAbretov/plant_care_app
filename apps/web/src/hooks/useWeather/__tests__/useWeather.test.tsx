import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@api';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { WeatherSnapshot } from '@types';

import { deferred, weatherSnapshot } from '../../../test/fixtures';
import { useWeather, WeatherProvider } from '../useWeather';

const STORAGE_KEY = 'plant-care.weather-location';
const REFRESH_MS = 15 * 60 * 1000;

const api = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@api', async () => {
  const actual = await vi.importActual<typeof import('@api')>('@api');

  return {
    ...actual,
    weatherApi: api,
  };
});

const geo = {
  clearWatch: vi.fn(),
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
};

const installGeo = (value: Geolocation | undefined): void => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value,
  });
};

const succeedGeo = (): void => {
  geo.getCurrentPosition.mockImplementation((success: PositionCallback) => {
    success({
      coords: { latitude: 55.75, longitude: 37.62 },
    } as GeolocationPosition);
  });
};

const failGeo = (): void => {
  geo.getCurrentPosition.mockImplementation(
    (_success: PositionCallback, error?: PositionErrorCallback) => {
      error?.({} as GeolocationPositionError);
    },
  );
};

const renderWeather = () => {
  return renderHook(() => useWeather(), {
    wrapper: ({ children }) => <WeatherProvider>{children}</WeatherProvider>,
  });
};

const waitUntilSettled = async (
  result: ReturnType<typeof renderWeather>['result'],
): Promise<void> => {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
};

describe('useWeather', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.get.mockResolvedValue(weatherSnapshot());
    geo.getCurrentPosition.mockReset();
    succeedGeo();
    installGeo(geo as Geolocation);
    localStorage.clear();
  });

  it('требует WeatherProvider', () => {
    expect(() => renderHook(() => useWeather())).toThrow(
      'useWeather must be used within WeatherProvider',
    );
  });

  it('берёт город из localStorage и не спрашивает геолокацию', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ city: 'Казань', mode: 'city' }),
    );

    const { result } = renderWeather();

    await waitUntilSettled(result);

    expect(api.get).toHaveBeenCalledWith({ city: 'Казань' });
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.source).toBe('city');
    expect(result.current.weather?.locationLabel).toBe('Москва');
  });

  it('берёт сохранённые координаты', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: 1, lon: 2, mode: 'geo' }),
    );

    const { result } = renderWeather();

    await waitUntilSettled(result);

    expect(api.get).toHaveBeenCalledWith({ lat: 1, lon: 2 });
    expect(result.current.source).toBe('geo');
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('игнорирует битое, пустое и неполное сохранённое место', async () => {
    const cases = [
      '{',
      '',
      JSON.stringify({ city: '   ', mode: 'city' }),
      JSON.stringify({ mode: 'city' }),
      JSON.stringify({ lat: null, lon: 1, mode: 'geo' }),
      JSON.stringify({ mode: 'other' }),
    ];

    for (const raw of cases) {
      localStorage.setItem(STORAGE_KEY, raw);
      failGeo();

      const { result, unmount } = renderWeather();

      await waitUntilSettled(result);

      expect(api.get).toHaveBeenCalledWith(undefined);
      expect(result.current.source).toBe('default');
      unmount();
      api.get.mockClear();
      localStorage.clear();
    }
  });

  it('сохраняет геолокацию и запрашивает погоду по координатам', async () => {
    const { result } = renderWeather();

    await waitUntilSettled(result);

    expect(api.get).toHaveBeenCalledWith({ lat: 55.75, lon: 37.62 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      lat: 55.75,
      lon: 37.62,
      mode: 'geo',
    });
    expect(result.current.source).toBe('geo');
  });

  it('падает на погоду по умолчанию, если геолокации нет', async () => {
    failGeo();

    const denied = renderWeather();

    await waitUntilSettled(denied.result);
    expect(api.get).toHaveBeenCalledWith(undefined);
    expect(denied.result.current.source).toBe('default');

    installGeo(undefined);
    api.get.mockClear();

    const missing = renderWeather();

    await waitUntilSettled(missing.result);
    expect(api.get).toHaveBeenCalledWith(undefined);
  });

  it('показывает текст ApiError и запасной текст', async () => {
    failGeo();
    api.get.mockRejectedValueOnce(new ApiError('Город не найден', 404));

    const http = renderWeather();

    await waitUntilSettled(http.result);
    expect(http.result.current.error).toBe('Город не найден');
    expect(http.result.current.weather).toBeNull();

    api.get.mockRejectedValueOnce(new Error('boom'));

    const generic = renderWeather();

    await waitUntilSettled(generic.result);
    expect(generic.result.current.error).toBe('Не удалось загрузить погоду');

    api.get.mockRejectedValueOnce('x');

    const unknown = renderWeather();

    await waitUntilSettled(unknown.result);
    expect(unknown.result.current.error).toBe('Не удалось загрузить погоду');
  });

  it('меняет город и перезагружает текущий запрос', async () => {
    failGeo();

    const { result } = renderWeather();

    await waitUntilSettled(result);

    const callsBefore = api.get.mock.calls.length;

    await act(async () => {
      await result.current.selectCity('   ');
    });

    expect(api.get.mock.calls.length).toBe(callsBefore);

    const next = weatherSnapshot({ locationLabel: 'Тверь' });

    api.get.mockResolvedValueOnce(next);

    await act(async () => {
      await result.current.selectCity('  Тверь  ');
    });

    expect(api.get).toHaveBeenCalledWith({ city: 'Тверь' });
    expect(result.current.weather?.locationLabel).toBe('Тверь');
    expect(result.current.source).toBe('city');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      city: 'Тверь',
      mode: 'city',
    });

    api.get.mockResolvedValueOnce(weatherSnapshot());

    await act(async () => {
      await result.current.reload();
    });

    expect(api.get).toHaveBeenLastCalledWith({ city: 'Тверь' });
  });

  it('запрашивает геолокацию по кнопке и сообщает об отказе', async () => {
    failGeo();

    const { result } = renderWeather();

    await waitUntilSettled(result);

    succeedGeo();
    const located = weatherSnapshot({ locationLabel: 'Рядом' });

    api.get.mockResolvedValueOnce(located);

    await act(async () => {
      await expect(result.current.locate()).resolves.toEqual(located);
    });

    expect(result.current.source).toBe('geo');
    expect(result.current.error).toBeNull();

    failGeo();

    await act(async () => {
      await expect(result.current.locate()).resolves.toBeNull();
    });

    expect(result.current.error).toBe('Нет доступа к геолокации');
    expect(result.current.loading).toBe(false);
  });

  it('отбрасывает устаревший ответ и держит загрузку', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ city: 'Казань', mode: 'city' }),
    );

    const first = deferred<WeatherSnapshot>();
    const second = deferred<WeatherSnapshot>();

    api.get
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderWeather();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    let selection: Promise<void> = Promise.resolve();

    act(() => {
      selection = result.current.selectCity('Омск');
    });

    await act(async () => {
      first.resolve(weatherSnapshot({ locationLabel: 'Старое' }));
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.weather).toBeNull();

    const fresh = weatherSnapshot({ locationLabel: 'Омск' });

    await act(async () => {
      second.resolve(fresh);
      await selection;
    });

    expect(result.current.weather).toEqual(fresh);
    expect(result.current.loading).toBe(false);
  });

  it('игнорирует ошибку устаревшего запроса', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ city: 'Казань', mode: 'city' }),
    );

    const first = deferred<WeatherSnapshot>();
    const fresh = weatherSnapshot({ locationLabel: 'Омск' });

    api.get.mockReturnValueOnce(first.promise).mockResolvedValueOnce(fresh);

    const { result } = renderWeather();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.selectCity('Омск');
    });

    await act(async () => {
      first.reject(new ApiError('Старая ошибка', 500));
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.weather?.locationLabel).toBe('Омск');
  });

  it('тихо обновляет погоду и не затирает экран ошибкой', async () => {
    failGeo();

    const intervalSpy = vi.spyOn(window, 'setInterval');
    const { result, unmount } = renderWeather();

    await waitUntilSettled(result);

    const refreshCall = [...intervalSpy.mock.calls]
      .reverse()
      .find((call) => call[1] === REFRESH_MS);
    const refresh = refreshCall?.[0] as (() => void) | undefined;

    expect(refresh).toEqual(expect.any(Function));

    const pending = deferred<WeatherSnapshot>();

    api.get.mockReturnValueOnce(pending.promise);
    refresh?.();
    expect(result.current.loading).toBe(false);

    const next = weatherSnapshot({ locationLabel: 'Обновлено' });

    await act(async () => {
      pending.resolve(next);
    });

    expect(result.current.weather?.locationLabel).toBe('Обновлено');
    expect(result.current.error).toBeNull();

    api.get.mockRejectedValueOnce(new Error('later'));

    await act(async () => {
      refresh?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();

    unmount();
    intervalSpy.mockRestore();
  });
});
