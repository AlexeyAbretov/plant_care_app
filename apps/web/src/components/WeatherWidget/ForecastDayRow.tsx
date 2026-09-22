import { Typography } from 'antd';

import { formatRuDayMonth, formatRuWeekday } from '@utils';

import type { ForecastDayRowProps } from './WeatherWidget.types';
import { formatTemperatureC, weatherKindEmoji } from './WeatherWidget.utils';

export const ForecastDayRow = ({
  day,
}: ForecastDayRowProps): React.JSX.Element => {
  const weekday = formatRuWeekday(day.date);
  const dateLabel = formatRuDayMonth(day.date);
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
        <span className="weather-forecast-label">{day.condition}</span>
      </Typography.Text>
      <Typography.Text className="weather-forecast-temp">
        {range}
      </Typography.Text>
    </div>
  );
};
