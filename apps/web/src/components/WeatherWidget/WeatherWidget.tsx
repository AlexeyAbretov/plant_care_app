import './WeatherWidget.css';

import { Popover } from 'antd';

import { WeatherPopoverContent } from './WeatherPopoverContent';
import { WeatherTrigger } from './WeatherTrigger';
import type { WeatherWidgetProps } from './WeatherWidget.types';

export const WeatherWidget = (props: WeatherWidgetProps): React.JSX.Element => {
  const { loading, weather } = props;

  return (
    <Popover
      content={<WeatherPopoverContent {...props} />}
      getPopupContainer={() => document.body}
      placement="bottomRight"
      title={weather?.locationLabel ?? 'Погода'}
      trigger="click"
    >
      <span style={{ display: 'inline-flex' }}>
        <WeatherTrigger loading={loading} weather={weather} />
      </span>
    </Popover>
  );
};
