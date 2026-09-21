import { useEffect, useState } from 'react';

import { WeatherWidget } from '@components';
import { useWeather } from '@hooks';

export const WeatherWidgetContainer = (): React.JSX.Element => {
  const { error, loading, locate, reload, selectCity, source, weather } =
    useWeather();
  const [cityInput, setCityInput] = useState('');

  useEffect(() => {
    if (source === 'geo') {
      setCityInput('');

      return;
    }

    setCityInput(weather?.locationLabel ?? '');
  }, [source, weather?.locationLabel]);

  const handleSearch = (value: string): void => {
    void selectCity(value);
  };

  const handleLocate = (): void => {
    void locate();
  };

  const handleRetry = (): void => {
    void reload();
  };

  return (
    <WeatherWidget
      cityInput={cityInput}
      error={error}
      loading={loading}
      onCityInputChange={setCityInput}
      onLocate={handleLocate}
      onRetry={handleRetry}
      onSearch={handleSearch}
      weather={weather}
    />
  );
};
