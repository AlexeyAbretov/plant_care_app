import type { WateringClimate, WeatherConditionKind } from '@types';

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

export const wateringClimateNotes = (climate: WateringClimate): string[] => {
  const notes: string[] = [];

  if (climate.heatingSeason) {
    notes.push('Отопительный сезон: комнатные сохнут быстрее');
  }

  if (climate.heat) {
    notes.push('Жара: земля сохнет быстрее');
  }

  if (climate.overcast && !climate.heat && !climate.heatingSeason) {
    notes.push('На неделе мало солнца: можно поливать чуть позже');
  }

  if (climate.precipitationLikely) {
    notes.push('На неделе осадки: уличным можно поливать позже');
  }

  return notes;
};
