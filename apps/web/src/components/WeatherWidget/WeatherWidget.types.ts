import type { WeatherDay, WeatherSnapshot } from '@types';

export type WeatherWidgetProps = {
  cityInput: string;
  error: string | null;
  loading: boolean;
  onCityInputChange: (value: string) => void;
  onLocate: () => void;
  onRetry: () => void;
  onSearch: (value: string) => void;
  weather: WeatherSnapshot | null;
};

export type WeatherTriggerProps = Pick<
  WeatherWidgetProps,
  'loading' | 'weather'
>;

export type WeatherPopoverContentProps = WeatherWidgetProps;

export type ForecastDayRowProps = {
  day: WeatherDay;
};
