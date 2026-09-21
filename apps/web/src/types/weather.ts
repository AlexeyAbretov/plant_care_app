export type WeatherConditionKind =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

export type WeatherSource = 'city' | 'default' | 'geo';

export interface WeatherCurrent {
  temperatureC: number;
  weatherCode: number;
  kind: WeatherConditionKind;
  condition: string;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  kind: WeatherConditionKind;
  condition: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationProbability: number;
}

export interface WateringClimate {
  heatingSeason: boolean;
  heat: boolean;
  overcast: boolean;
  precipitationLikely: boolean;
}

export interface WeatherSnapshot {
  locationLabel: string;
  latitude: number;
  longitude: number;
  current: WeatherCurrent;
  daily: WeatherDay[];
  wateringClimate: WateringClimate;
}

export interface WeatherQuery {
  city?: string;
  lat?: number;
  lon?: number;
}
