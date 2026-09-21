import type { WeatherConditionKind } from '@types';

const WEATHER_KIND_EMOJI: Record<WeatherConditionKind, string> = {
  clear: '☀️',
  partlyCloudy: '⛅',
  cloudy: '☁️',
  drizzle: '🌦️',
  fog: '🌫️',
  rain: '🌧️',
  snow: '❄️',
  thunder: '⛈️',
};

export const weatherKindEmoji = (kind: WeatherConditionKind): string => {
  return WEATHER_KIND_EMOJI[kind] ?? '☁️';
};

export const formatTemperatureC = (value: number): string => {
  const rounded = Math.round(value);

  if (rounded > 0) {
    return `+${rounded}°`;
  }

  return `${rounded}°`;
};
