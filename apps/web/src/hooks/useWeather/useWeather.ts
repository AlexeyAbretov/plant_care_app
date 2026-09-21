import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ApiError, weatherApi } from '@api';
import type { WeatherQuery, WeatherSnapshot, WeatherSource } from '@types';

const STORAGE_KEY = 'plant-care.weather-location';
const REFRESH_MS = 15 * 60 * 1000;
const GEO_TIMEOUT_MS = 8_000;
const GEO_MAX_AGE_MS = 10 * 60 * 1000;

type StoredWeatherLocation =
  { city: string; mode: 'city' } | { lat: number; lon: number; mode: 'geo' };

const useWeatherState = () => {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [source, setSource] = useState<WeatherSource>('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef<WeatherQuery | undefined>(undefined);
  const requestIdRef = useRef(0);

  const fetchWeather = useCallback(
    async (
      nextQuery?: WeatherQuery,
      nextSource: WeatherSource = 'default',
      options?: { silent?: boolean },
    ): Promise<void> => {
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;
      queryRef.current = nextQuery;

      if (options?.silent !== true) {
        setLoading(true);
        setError(null);
      }

      try {
        const snapshot = await weatherApi.get(nextQuery);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setWeather(snapshot);
        setSource(nextSource);
        setError(null);
      } catch (loadError: unknown) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (options?.silent === true) {
          return;
        }

        const errorMessage =
          loadError instanceof ApiError
            ? loadError.message
            : 'Не удалось загрузить погоду';

        setError(errorMessage);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const start = async (): Promise<void> => {
      const stored = readStoredLocation();

      if (stored?.mode === 'city') {
        await fetchWeather({ city: stored.city }, 'city');

        return;
      }

      if (stored?.mode === 'geo') {
        await fetchWeather({ lat: stored.lat, lon: stored.lon }, 'geo');

        return;
      }

      try {
        const coords = await requestGeolocation();

        writeStoredLocation({
          mode: 'geo',
          lat: coords.lat,
          lon: coords.lon,
        });
        await fetchWeather({ lat: coords.lat, lon: coords.lon }, 'geo');
      } catch {
        await fetchWeather(undefined, 'default');
      }
    };

    void start();
  }, [fetchWeather]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchWeather(queryRef.current, source, { silent: true });
    }, REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchWeather, source]);

  const selectCity = useCallback(
    async (city: string): Promise<void> => {
      const nextCity = city.trim();

      if (nextCity === '') {
        return;
      }

      writeStoredLocation({ mode: 'city', city: nextCity });
      await fetchWeather({ city: nextCity }, 'city');
    },
    [fetchWeather],
  );

  const locate = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const coords = await requestGeolocation();

      writeStoredLocation({
        mode: 'geo',
        lat: coords.lat,
        lon: coords.lon,
      });
      await fetchWeather({ lat: coords.lat, lon: coords.lon }, 'geo');
    } catch {
      setLoading(false);
      setError('Нет доступа к геолокации');
    }
  }, [fetchWeather]);

  const reload = useCallback(async (): Promise<void> => {
    await fetchWeather(queryRef.current, source);
  }, [fetchWeather, source]);

  return {
    error,
    loading,
    locate,
    reload,
    selectCity,
    source,
    weather,
  };
};

type WeatherContextValue = ReturnType<typeof useWeatherState>;

const WeatherContext = createContext<WeatherContextValue | null>(null);

export const WeatherProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const value = useWeatherState();

  return createElement(WeatherContext.Provider, { value }, children);
};

export const useWeather = (): WeatherContextValue => {
  const value = useContext(WeatherContext);

  if (value === null) {
    throw new Error('useWeather must be used within WeatherProvider');
  }

  return value;
};

const readStoredLocation = (): StoredWeatherLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null || raw === '') {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredWeatherLocation;

    if (parsed.mode === 'city' && parsed.city.trim() !== '') {
      return parsed;
    }

    if (parsed.mode === 'geo') {
      if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon)) {
        return parsed;
      }

      return null;
    }

    return null;
  } catch {
    return null;
  }
};

const writeStoredLocation = (value: StoredWeatherLocation): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const requestGeolocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation === undefined) {
      reject(new Error('Геолокация недоступна'));

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        reject(new Error('Нет доступа к геолокации'));
      },
      {
        enableHighAccuracy: false,
        maximumAge: GEO_MAX_AGE_MS,
        timeout: GEO_TIMEOUT_MS,
      },
    );
  });
};
