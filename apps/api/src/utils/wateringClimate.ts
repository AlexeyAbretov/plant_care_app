import type {
  WateringClimate,
  WeatherConditionKind,
  WeatherDay,
} from '../types/weather.js';

const HEATING_MEAN_TEMP_C = 8;
const HEAT_TEMP_C = 26;
const PRECIP_PROBABILITY = 60;
const FORECAST_DAYS = 7;

const SUNLESS_KINDS = new Set<WeatherConditionKind>([
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'thunder',
]);
const WET_KINDS = new Set<WeatherConditionKind>([
  'drizzle',
  'rain',
  'snow',
  'thunder',
]);

export function deriveWateringClimate(daily: WeatherDay[]): WateringClimate {
  const week = daily.slice(0, FORECAST_DAYS);

  return {
    heatingSeason: isMajority(week, isColdDay),
    heat: isMajority(week, isHotDay),
    overcast: isMajority(week, isSunlessDay),
    precipitationLikely: isMajority(week, isWetDay),
  };
}

function isMajority(
  days: WeatherDay[],
  match: (day: WeatherDay) => boolean,
): boolean {
  if (days.length === 0) {
    return false;
  }

  const matched = days.filter(match).length;

  return matched >= Math.ceil(days.length / 2);
}

function isColdDay(day: WeatherDay): boolean {
  return dailyMeanTemp(day) <= HEATING_MEAN_TEMP_C;
}

function isHotDay(day: WeatherDay): boolean {
  return day.tempMaxC >= HEAT_TEMP_C;
}

function isSunlessDay(day: WeatherDay): boolean {
  return SUNLESS_KINDS.has(day.kind);
}

function isWetDay(day: WeatherDay): boolean {
  if (day.precipitationProbability >= PRECIP_PROBABILITY) {
    return true;
  }

  return WET_KINDS.has(day.kind);
}

function dailyMeanTemp(day: WeatherDay): number {
  return (day.tempMinC + day.tempMaxC) / 2;
}
