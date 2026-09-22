import { beforeEach, describe, expect, it, vi } from 'vitest';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WeatherSnapshot } from '@types';

import { weatherSnapshot } from '../../../test/fixtures';
import { renderUi } from '../../../test/render';
import { WeatherWidgetContainer } from '../WeatherWidgetContainer';

const weather = vi.hoisted(() => ({
  error: null as string | null,
  loading: false,
  locate: vi.fn<() => Promise<WeatherSnapshot | null>>(),
  reload: vi.fn<() => Promise<void>>(),
  selectCity: vi.fn<(city: string) => Promise<void>>(),
  weather: null as WeatherSnapshot | null,
}));

vi.mock('@hooks', () => ({
  useWeather: () => weather,
}));

describe('WeatherWidgetContainer', () => {
  beforeEach(() => {
    weather.error = null;
    weather.loading = false;
    weather.weather = null;
    weather.locate.mockReset();
    weather.reload.mockReset();
    weather.selectCity.mockReset();
    weather.locate.mockResolvedValue(null);
    weather.reload.mockResolvedValue(undefined);
    weather.selectCity.mockResolvedValue(undefined);
  });

  it('показывает загрузку и подставляет город из снимка', async () => {
    weather.loading = true;

    const loading = renderUi(<WeatherWidgetContainer />);

    expect(loading.container).toMatchSnapshot();
    loading.unmount();

    weather.loading = false;
    weather.weather = weatherSnapshot();

    renderUi(<WeatherWidgetContainer />);

    expect(screen.getByRole('button', { name: /Погода:/ })).toBeTruthy();
  });

  it('ищет город, повторяет запрос и обновляет поле', async () => {
    const user = userEvent.setup();

    weather.error = 'Нет сети';
    weather.weather = weatherSnapshot();

    const { baseElement } = renderUi(<WeatherWidgetContainer />);

    await user.click(screen.getByRole('button', { name: /Погода:/ }));

    const input = await screen.findByPlaceholderText('Город');

    await waitFor(() => {
      expect(input).toHaveValue('Москва');
    });
    expect(baseElement).toMatchSnapshot();

    await user.clear(input);
    await user.type(input, 'Сочи');
    await user.keyboard('{Enter}');
    expect(weather.selectCity).toHaveBeenCalledWith('Сочи');

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(weather.reload).toHaveBeenCalledOnce();

    weather.locate.mockResolvedValue(
      weatherSnapshot({ locationLabel: 'Рядом' }),
    );

    await user.click(
      screen.getByRole('button', { name: /Моё местоположение/ }),
    );

    await waitFor(() => {
      expect(input).toHaveValue('Рядом');
    });

    weather.locate.mockResolvedValue(null);
    await user.clear(input);
    await user.type(input, 'Черновик');
    await user.click(
      screen.getByRole('button', { name: /Моё местоположение/ }),
    );

    expect(input).toHaveValue('Черновик');
  });
});
