import { describe, expect, it } from 'vitest';

import type { WateringClimate, WeatherConditionKind } from '@types';

import {
  formatTemperatureC,
  wateringClimateNotes,
  weatherKindEmoji,
} from '../WeatherWidget.utils';

const climate = (overrides: Partial<WateringClimate> = {}): WateringClimate => {
  return {
    heat: false,
    heatingSeason: false,
    overcast: false,
    precipitationLikely: false,
    ...overrides,
  };
};

describe('WeatherWidget.utils', () => {
  it('подбирает emoji и температуру', () => {
    const kinds: WeatherConditionKind[] = [
      'clear',
      'partlyCloudy',
      'cloudy',
      'drizzle',
      'fog',
      'rain',
      'snow',
      'thunder',
    ];

    expect(kinds.map((kind) => weatherKindEmoji(kind))).toEqual([
      '☀️',
      '⛅',
      '☁️',
      '🌦️',
      '🌫️',
      '🌧️',
      '❄️',
      '⛈️',
    ]);
    expect(weatherKindEmoji('unknown' as WeatherConditionKind)).toBe('☁️');
    expect(formatTemperatureC(18.4)).toBe('+18°');
    expect(formatTemperatureC(0.4)).toBe('0°');
    expect(formatTemperatureC(-3.2)).toBe('-3°');
  });

  it('собирает заметки о поливе и прячет пасмурность в жару', () => {
    expect(wateringClimateNotes(climate())).toEqual([]);
    expect(
      wateringClimateNotes(
        climate({
          heat: true,
          heatingSeason: true,
          overcast: true,
          precipitationLikely: true,
        }),
      ),
    ).toEqual([
      'Отопительный сезон: комнатные сохнут быстрее',
      'Жара: земля сохнет быстрее',
      'На неделе осадки: уличным можно поливать позже',
    ]);
    expect(wateringClimateNotes(climate({ overcast: true }))).toEqual([
      'На неделе мало солнца: можно поливать чуть позже',
    ]);
  });
});
