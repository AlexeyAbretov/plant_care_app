import { Typography } from 'antd';
import dayjs from 'dayjs';

import type { ForecastDayRowProps } from './WeatherWidget.types';
import { formatTemperatureC, weatherKindEmoji } from './WeatherWidget.utils';

export const ForecastDayRow = ({
  day,
}: ForecastDayRowProps): React.JSX.Element => {
  const weekday = dayjs(day.date).format('dd');
  const dateLabel = dayjs(day.date).format('D MMM');
  const emoji = weatherKindEmoji(day.kind);
  const range =
    `${formatTemperatureC(day.tempMinC)} / ` + formatTemperatureC(day.tempMaxC);

  return (
    <div className="weather-forecast-row">
      <Typography.Text className="weather-forecast-date">
        {weekday}, {dateLabel}
      </Typography.Text>
      <Typography.Text className="weather-forecast-condition">
        <span aria-hidden className="weather-forecast-emoji">
          {emoji}
        </span>
        {day.condition}
      </Typography.Text>
      <Typography.Text className="weather-forecast-temp">
        {range}
      </Typography.Text>
    </div>
  );
};
