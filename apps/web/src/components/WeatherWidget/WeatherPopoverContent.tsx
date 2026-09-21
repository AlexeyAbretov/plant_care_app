import { Button, Flex, Input, Typography } from 'antd';

import { AimOutlined } from '@ant-design/icons';

import { ForecastDayRow } from './ForecastDayRow';
import type { WeatherPopoverContentProps } from './WeatherWidget.types';

export const WeatherPopoverContent = ({
  cityInput,
  error,
  loading,
  onCityInputChange,
  onLocate,
  onRetry,
  onSearch,
  weather,
}: WeatherPopoverContentProps): React.JSX.Element => {
  return (
    <Flex style={{ width: 300 }} vertical gap={12}>
      <Input.Search
        allowClear
        loading={loading}
        onChange={(event) => {
          onCityInputChange(event.target.value);
        }}
        onSearch={onSearch}
        placeholder="Город"
        value={cityInput}
      />
      <Button
        block
        icon={<AimOutlined />}
        loading={loading}
        onClick={onLocate}
        size="small"
      >
        Моё местоположение
      </Button>
      {error !== null ? (
        <Flex align="center" gap={8} justify="space-between">
          <Typography.Text type="danger">{error}</Typography.Text>
          <Button onClick={onRetry} size="small" type="link">
            Повторить
          </Button>
        </Flex>
      ) : null}
      {weather !== null ? (
        <Flex vertical gap={6}>
          {weather.daily.map((day) => (
            <ForecastDayRow day={day} key={day.date} />
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
};
