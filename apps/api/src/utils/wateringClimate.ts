import type {
  WateringClimate,
  WeatherConditionKind,
  WeatherCurrent,
  WeatherDay,
} from '../types/weather.js';

const HEATING_MEAN_TEMP_C = 8;
const HEATING_WINDOW_DAYS = 4;
const HEATING_COLD_DAYS = 3;
const HEAT_TEMP_C = 26;
const PRECIP_PROBABILITY = 60;
const WET_KINDS = new Set<WeatherConditionKind>([
  'drizzle',
  'rain',
  'snow',
  'thunder',
]);
const OVERCAST_KINDS = new Set<WeatherConditionKind>(['cloudy', 'fog']);

export function deriveWateringClimate(
  current: WeatherCurrent,
  daily: WeatherDay[],
): WateringClimate {
  const window = daily.slice(0, HEATING_WINDOW_DAYS);
  const coldDays = window.filter(
    (day) => dailyMeanTemp(day) <= HEATING_MEAN_TEMP_C,
  ).length;
  const today = daily[0];
  const todayMax = today?.tempMaxC ?? current.temperatureC;

  return {
    heatingSeason: coldDays >= HEATING_COLD_DAYS,
    heat: todayMax >= HEAT_TEMP_C || current.temperatureC >= HEAT_TEMP_C,
    overcast: isOvercast(current, today),
    precipitationLikely: isPrecipitationLikely(today),
  };
}

function dailyMeanTemp(day: WeatherDay): number {
  return (day.tempMinC + day.tempMaxC) / 2;
}

function isOvercast(
  current: WeatherCurrent,
  today: WeatherDay | undefined,
): boolean {
  if (OVERCAST_KINDS.has(current.kind)) {
    return true;
  }

  const todayKind = today?.kind;

  if (todayKind === undefined) {
    return false;
  }

  return OVERCAST_KINDS.has(todayKind);
}

function isPrecipitationLikely(today: WeatherDay | undefined): boolean {
  if (today === undefined) {
    return false;
  }

  if (today.precipitationProbability >= PRECIP_PROBABILITY) {
    return true;
  }

  return WET_KINDS.has(today.kind);
}
