import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { expect, fn, userEvent, within } from 'storybook/test';

import type { WeatherDay, WeatherSnapshot } from '@types';

import { WeatherWidget } from '../WeatherWidget';

const day = (offset: number, fields: Omit<WeatherDay, 'date'>): WeatherDay => {
  return {
    date: dayjs().add(offset, 'day').format('YYYY-MM-DD'),
    ...fields,
  };
};

const weather: WeatherSnapshot = {
  locationLabel: 'Москва',
  latitude: 55.75,
  longitude: 37.62,
  current: {
    temperatureC: 18,
    weatherCode: 2,
    kind: 'partlyCloudy',
    condition: 'Переменная облачность',
  },
  daily: [
    day(0, {
      weatherCode: 2,
      kind: 'partlyCloudy',
      condition: 'Переменная облачность',
      tempMinC: 12,
      tempMaxC: 19,
      precipitationProbability: 20,
    }),
    day(1, {
      weatherCode: 61,
      kind: 'rain',
      condition: 'Дождь',
      tempMinC: 10,
      tempMaxC: 15,
      precipitationProbability: 80,
    }),
    day(2, {
      weatherCode: 0,
      kind: 'clear',
      condition: 'Ясно',
      tempMinC: 11,
      tempMaxC: 20,
      precipitationProbability: 5,
    }),
  ],
  wateringClimate: {
    heatingSeason: false,
    heat: false,
    overcast: false,
    precipitationLikely: false,
  },
};

const meta = {
  title: 'Components/WeatherWidget',
  component: WeatherWidget,
  decorators: [
    (Story) => (
      <div style={{ background: '#001529', padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    cityInput: 'Москва',
    error: null,
    loading: false,
    onCityInputChange: fn(),
    onLocate: fn(),
    onRetry: fn(),
    onSearch: fn(),
    weather,
  },
} satisfies Meta<typeof WeatherWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

const openPopover = async (canvasElement: HTMLElement): Promise<void> => {
  const canvas = within(canvasElement);

  await userEvent.click(canvas.getByRole('button'));
};

export const Loaded: Story = {
  name: 'Прогноз',
  play: async ({ canvasElement }) => {
    await openPopover(canvasElement);

    await expect(
      await within(document.body).findByText('Дождь'),
    ).toBeInTheDocument();
  },
};

export const HeatingSeason: Story = {
  name: 'Отопительный сезон',
  args: {
    weather: {
      ...weather,
      wateringClimate: {
        heatingSeason: true,
        heat: false,
        overcast: false,
        precipitationLikely: true,
      },
    },
  },
  play: async ({ canvasElement }) => {
    await openPopover(canvasElement);

    await expect(
      await within(document.body).findByText(
        'Отопительный сезон: комнатные сохнут быстрее',
      ),
    ).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: 'Загрузка',
  args: {
    cityInput: '',
    loading: true,
    weather: null,
  },
};

export const Unavailable: Story = {
  name: 'Нет данных',
  args: {
    cityInput: '',
    weather: null,
  },
};

export const Failed: Story = {
  name: 'Ошибка',
  args: {
    error: 'Не удалось получить погоду',
    weather: null,
  },
  play: async ({ canvasElement }) => {
    await openPopover(canvasElement);

    await expect(
      await within(document.body).findByText('Не удалось получить погоду'),
    ).toBeInTheDocument();
  },
};
