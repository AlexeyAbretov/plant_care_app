import { z } from 'zod';

import { config } from '../config.js';
import type {
  WeatherConditionKind,
  WeatherDay,
  WeatherQuery,
  WeatherSnapshot,
} from '../types/weather.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const GEO_LOCATION_LABEL = 'Моя локация';

export class WeatherNotFoundError extends Error {
  constructor(message = 'Город не найден') {
    super(message);
    this.name = 'WeatherNotFoundError';
  }
}

export class WeatherUnavailableError extends Error {
  constructor(message = 'Не удалось получить погоду') {
    super(message);
    this.name = 'WeatherUnavailableError';
  }
}

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});

const forecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()).optional(),
  }),
});

type CacheEntry = {
  expiresAt: number;
  value: WeatherSnapshot;
};

type GeoPlace = {
  latitude: number;
  locationLabel: string;
  longitude: number;
};

const cache = new Map<string, CacheEntry>();

export async function getWeather(
  query: WeatherQuery,
): Promise<WeatherSnapshot> {
  if (query.lat !== undefined && query.lon !== undefined) {
    return getWeatherByCoords(query.lat, query.lon, GEO_LOCATION_LABEL);
  }

  const city = query.city ?? config.weatherDefaultCity;

  return getWeatherByCity(city);
}

export function describeWeatherCode(code: number): {
  condition: string;
  kind: WeatherConditionKind;
} {
  if (code === 0 || code === 1) {
    return { kind: 'clear', condition: 'ясно' };
  }

  if (code === 2) {
    return { kind: 'partlyCloudy', condition: 'малооблачно' };
  }

  if (code === 3) {
    return { kind: 'cloudy', condition: 'облачно' };
  }

  if (code === 45 || code === 48) {
    return { kind: 'fog', condition: 'туман' };
  }

  if (code >= 51 && code <= 57) {
    return { kind: 'drizzle', condition: 'морось' };
  }

  if (code >= 61 && code <= 67) {
    return { kind: 'rain', condition: 'дождь' };
  }

  if (code >= 71 && code <= 77) {
    return { kind: 'snow', condition: 'снег' };
  }

  if (code >= 80 && code <= 82) {
    return { kind: 'rain', condition: 'ливень' };
  }

  if (code === 85 || code === 86) {
    return { kind: 'snow', condition: 'снег' };
  }

  if (code >= 95) {
    return { kind: 'thunder', condition: 'гроза' };
  }

  return { kind: 'cloudy', condition: 'облачно' };
}

async function getWeatherByCity(city: string): Promise<WeatherSnapshot> {
  const cacheKey = `city:${city.trim().toLocaleLowerCase('ru')}`;
  const cached = readCache(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const place = await geocodeCity(city);
  const snapshot = await fetchForecast(place);

  writeCache(cacheKey, snapshot);
  writeCache(coordsCacheKey(place.latitude, place.longitude), snapshot);

  return snapshot;
}

async function getWeatherByCoords(
  lat: number,
  lon: number,
  locationLabel: string,
): Promise<WeatherSnapshot> {
  const cacheKey = coordsCacheKey(lat, lon);
  const cached = readCache(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const snapshot = await fetchForecast({
    latitude: lat,
    longitude: lon,
    locationLabel,
  });

  writeCache(cacheKey, snapshot);

  return snapshot;
}

async function geocodeCity(city: string): Promise<GeoPlace> {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'ru',
    format: 'json',
  });
  const payload = await fetchJson(`${GEOCODING_URL}?${params.toString()}`);
  const parsed = geocodingSchema.safeParse(payload);
  const place = parsed.success ? parsed.data.results?.[0] : undefined;

  if (!parsed.success || place === undefined) {
    throw new WeatherNotFoundError(`Город «${city}» не найден`);
  }

  const regionSuffix =
    place.admin1 !== undefined && place.admin1 !== place.name
      ? `, ${place.admin1}`
      : '';

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    locationLabel: `${place.name}${regionSuffix}`,
  };
}

async function fetchForecast(place: GeoPlace): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,' +
      'precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  const payload = await fetchJson(`${FORECAST_URL}?${params.toString()}`);
  const parsed = forecastSchema.safeParse(payload);

  if (!parsed.success) {
    throw new WeatherUnavailableError();
  }

  const currentDescribed = describeWeatherCode(
    parsed.data.current.weather_code,
  );

  return {
    locationLabel: place.locationLabel,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    current: {
      temperatureC: parsed.data.current.temperature_2m,
      weatherCode: parsed.data.current.weather_code,
      kind: currentDescribed.kind,
      condition: currentDescribed.condition,
    },
    daily: mapDaily(parsed.data.daily),
  };
}

function mapDaily(
  daily: z.infer<typeof forecastSchema>['daily'],
): WeatherDay[] {
  return daily.time.map((date, index) => {
    const code = daily.weather_code[index] ?? 3;
    const described = describeWeatherCode(code);
    const precip = daily.precipitation_probability_max?.[index] ?? 0;

    return {
      date,
      weatherCode: code,
      kind: described.kind,
      condition: described.condition,
      tempMinC: daily.temperature_2m_min[index] ?? 0,
      tempMaxC: daily.temperature_2m_max[index] ?? 0,
      precipitationProbability: precip,
    };
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new WeatherUnavailableError();
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof WeatherUnavailableError) {
      throw error;
    }

    throw new WeatherUnavailableError();
  } finally {
    clearTimeout(timeoutId);
  }
}

function coordsCacheKey(lat: number, lon: number): string {
  return `geo:${roundCoord(lat)},${roundCoord(lon)}`;
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

function readCache(key: string): WeatherSnapshot | undefined {
  const entry = cache.get(key);

  if (entry === undefined) {
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);

    return undefined;
  }

  return entry.value;
}

function writeCache(key: string, value: WeatherSnapshot): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
