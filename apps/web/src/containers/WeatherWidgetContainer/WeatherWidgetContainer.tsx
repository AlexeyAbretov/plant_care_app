import { useEffect, useState } from 'react';

import { WeatherWidget } from '@components';
import { useWeather } from '@hooks';

export const WeatherWidgetContainer = (): React.JSX.Element => {
  const { error, loading, locate, reload, selectCity, weather } = useWeather();
  const [cityInput, setCityInput] = useState('');

  useEffect(() => {
    setCityInput(weather?.locationLabel ?? '');
  }, [weather?.locationLabel]);

  const handleSearch = (value: string): void => {
    void selectCity(value);
  };

  const handleLocate = (): void => {
    void locate().then((snapshot) => {
      if (snapshot === null) {
        return;
      }

      setCityInput(snapshot.locationLabel);
    });
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
