import { weatherSnapshot } from '@test/fixtures';
import { renderUi } from '@test/render';
import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ForecastDayRow } from '../ForecastDayRow';
import { WeatherPopoverContent } from '../WeatherPopoverContent';
import { WeatherTrigger } from '../WeatherTrigger';
import { WeatherWidget } from '../WeatherWidget';

const handlers = () => ({
  onCityInputChange: vi.fn(),
  onLocate: vi.fn(),
  onRetry: vi.fn(),
  onSearch: vi.fn(),
});

describe('WeatherWidget', () => {
  it('рисует загрузку, пустое состояние и текущую погоду', () => {
    const loading = renderUi(
      <WeatherWidget
        cityInput=""
        error={null}
        loading
        weather={null}
        {...handlers()}
      />,
    );

    expect(loading.container).toMatchSnapshot();
    loading.unmount();

    const empty = renderUi(<WeatherTrigger loading={false} weather={null} />);

    expect(empty.container).toMatchSnapshot();
    empty.unmount();

    const current = renderUi(
      <WeatherWidget
        cityInput="Москва"
        error={null}
        loading={false}
        weather={weatherSnapshot()}
        {...handlers()}
      />,
    );

    expect(current.container).toMatchSnapshot();
  });

  it('показывает заметки, прогноз, ошибку и вызывает действия', async () => {
    const user = userEvent.setup();
    const props = handlers();
    const notes = renderUi(
      <WeatherPopoverContent
        cityInput="Москва"
        error="Нет сети"
        loading={false}
        weather={weatherSnapshot({
          wateringClimate: {
            heat: true,
            heatingSeason: true,
            overcast: true,
            precipitationLikely: true,
          },
        })}
        {...props}
      />,
    );

    expect(notes.container).toMatchSnapshot();

    await user.type(screen.getByPlaceholderText('Город'), 'и');
    expect(props.onCityInputChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'search' }));
    expect(props.onSearch).toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /Моё местоположение/ }),
    );
    expect(props.onLocate).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(props.onRetry).toHaveBeenCalledOnce();
    notes.unmount();

    const quiet = renderUi(
      <WeatherPopoverContent
        cityInput=""
        error={null}
        loading
        weather={null}
        {...handlers()}
      />,
    );

    expect(quiet.container).toMatchSnapshot();
    quiet.unmount();

    const row = renderUi(
      <ForecastDayRow
        day={{
          condition: 'Ясно',
          date: '2026-09-23',
          kind: 'clear',
          precipitationProbability: 0,
          tempMaxC: 21.2,
          tempMinC: 0,
          weatherCode: 0,
        }}
      />,
    );

    expect(row.container).toMatchSnapshot();
  });

  it('открывает поповер по клику на триггер', async () => {
    const user = userEvent.setup();
    const { baseElement } = renderUi(
      <WeatherWidget
        cityInput="Москва"
        error={null}
        loading={false}
        weather={weatherSnapshot()}
        {...handlers()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Погода:/ }));
    expect(await screen.findByPlaceholderText('Город')).toBeTruthy();
    expect(baseElement).toMatchSnapshot();
  });
});
