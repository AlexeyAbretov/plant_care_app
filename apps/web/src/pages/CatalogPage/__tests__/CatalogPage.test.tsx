import { createPlant, plantImage, weatherSnapshot } from '@test/fixtures';
import { pathname, renderUi } from '@test/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Plant, PlantSort, WeatherSnapshot } from '@types';

import { CatalogPage } from '../CatalogPage';

const viewport = vi.hoisted(() => ({ wide: true }));

const catalog = vi.hoisted(() => ({
  assessPlant: vi.fn(),
  categories: [] as string[],
  categoryOptions: [] as string[],
  deletePlant: vi.fn(),
  error: null as string | null,
  fertilizePlant: vi.fn(),
  loading: false,
  plants: [] as Plant[],
  reload: vi.fn(),
  setCategories: vi.fn(),
  setSort: vi.fn(),
  sort: 'watering' as PlantSort,
  waterPlant: vi.fn(),
}));

const weather = vi.hoisted(() => ({
  weather: null as WeatherSnapshot | null,
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ md: viewport.wide }),
    },
  };
});

vi.mock('@hooks', () => ({
  usePlantsCatalog: () => catalog,
  useWeather: () => weather,
}));

describe('CatalogPage', () => {
  beforeEach(() => {
    viewport.wide = true;
    window.innerWidth = 1024;
    catalog.sort = 'watering';
    catalog.categories = [];
    catalog.categoryOptions = ['Декоративные'];
    catalog.plants = [];
    catalog.loading = false;
    catalog.error = null;
    catalog.reload.mockReset();
    catalog.setSort.mockReset();
    catalog.setCategories.mockReset();
    weather.weather = null;
  });

  it('показывает загрузку, ошибку и пустой каталог', async () => {
    const user = userEvent.setup();

    catalog.loading = true;
    catalog.plants = [createPlant()];

    const loading = renderUi(<CatalogPage />);

    expect(loading.container).toMatchSnapshot();
    loading.unmount();

    catalog.loading = false;
    catalog.error = 'Нет связи';
    catalog.reload.mockResolvedValue(undefined);

    const failed = renderUi(<CatalogPage />);

    expect(failed.container).toMatchSnapshot();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(catalog.reload).toHaveBeenCalledOnce();
    failed.unmount();

    catalog.error = null;
    catalog.plants = [];

    const empty = renderUi(<CatalogPage />);

    expect(empty.container).toMatchSnapshot();
    await user.click(screen.getByRole('link', { name: 'Добавить растение' }));
    expect(pathname()).toBe('/add');
  });

  it('сортирует по поливу и оставляет порядок подкормки', async () => {
    const user = userEvent.setup();
    const later = createPlant({
      id: 'later',
      images: [],
      imageUrl: '/legacy.jpg',
      lastWateredAt: '2026-09-22',
      name: 'Позже',
      thumbnailUrl: '/legacy-thumb.jpg',
    });
    const sooner = createPlant({
      id: 'sooner',
      images: [plantImage('a'), { ...plantImage('b'), isCover: false }],
      lastWateredAt: '2026-09-01',
      name: 'Раньше',
    });
    const uncovered = createPlant({
      id: 'plain',
      images: [{ ...plantImage('c'), isCover: false }],
      name: 'Без обложки',
    });

    catalog.plants = [later, sooner, uncovered];
    weather.weather = weatherSnapshot();

    const watering = renderUi(<CatalogPage />);
    const names = screen.getAllByRole('heading', { level: 5 }).map((node) => {
      return node.textContent;
    });

    expect(names.indexOf('Раньше')).toBeLessThan(names.indexOf('Позже'));
    expect(watering.container).toMatchSnapshot();

    fireEvent.click(screen.getByText('По подкормке'));
    expect(catalog.setSort).toHaveBeenCalledWith('fertilizing');

    await user.click(screen.getByText('Декоративные'));
    expect(catalog.setCategories).toHaveBeenCalled();
    watering.unmount();

    catalog.sort = 'fertilizing';
    catalog.plants = [later, sooner];

    renderUi(<CatalogPage />);

    const fertilizingNames = screen
      .getAllByRole('heading', { level: 5 })
      .map((node) => node.textContent);

    expect(fertilizingNames).toEqual(['Позже', 'Раньше']);
  });

  it('на узком экране открывает категории в выезжающей панели', async () => {
    const user = userEvent.setup();

    viewport.wide = false;
    window.innerWidth = 500;
    catalog.plants = [];

    const { baseElement } = renderUi(<CatalogPage />);

    expect(
      screen.queryByRole('complementary', { name: 'Фильтр по категориям' }),
    ).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Показать категории' }),
    );

    await waitFor(() => {
      expect(baseElement.querySelector('.ant-drawer')).toBeTruthy();
    });
  });
});
