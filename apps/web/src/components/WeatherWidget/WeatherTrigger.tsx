import { Button, Flex, Spin } from 'antd';

import type { WeatherTriggerProps } from './WeatherWidget.types';
import { formatTemperatureC, weatherKindEmoji } from './WeatherWidget.utils';

export const WeatherTrigger = ({
  loading,
  weather,
}: WeatherTriggerProps): React.JSX.Element => {
  if (weather === null && loading) {
    return (
      <Button
        aria-label="Загрузка погоды"
        style={{ color: '#fff' }}
        type="text"
      >
        <Spin size="small" />
      </Button>
    );
  }

  if (weather === null) {
    return (
      <Button
        aria-label="Погода недоступна"
        style={{ color: '#fff' }}
        type="text"
      >
        Нет данных
      </Button>
    );
  }

  const emoji = weatherKindEmoji(weather.current.kind);
  const temperature = formatTemperatureC(weather.current.temperatureC);
  const label = `${emoji} ${temperature}, ${weather.current.condition}`;

  return (
    <Button
      aria-label={`Погода: ${label}`}
      style={{ color: '#fff', height: 40, paddingInline: 8 }}
      type="text"
    >
      <Flex align="center" gap={8}>
        <span aria-hidden>{emoji}</span>
        <span>{temperature}</span>
        <span className="weather-widget-condition">
          {weather.current.condition}
        </span>
      </Flex>
    </Button>
  );
};
