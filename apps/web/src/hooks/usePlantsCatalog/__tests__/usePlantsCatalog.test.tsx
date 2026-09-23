import { createPlant } from '@test/fixtures';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@api';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ListPlantsParams } from '@types';

import { usePlantsCatalog } from '../usePlantsCatalog';

const messages = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

const api = vi.hoisted(() => ({
  assessConditionById: vi.fn(),
  delete: vi.fn(),
  fertilize: vi.fn(),
  list: vi.fn(),
  water: vi.fn(),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    message: messages,
  };
});

vi.mock('@api', async () => {
  const actual = await vi.importActual<typeof import('@api')>('@api');

  return {
    ...actual,
    plantsApi: api,
  };
});

describe('usePlantsCatalog', () => {
  beforeEach(() => {
    api.list.mockReset();
    api.list.mockResolvedValue([createPlant()]);
    api.water.mockReset();
    api.fertilize.mockReset();
    api.delete.mockReset();
    api.assessConditionById.mockReset();
    messages.success.mockReset();
    messages.error.mockReset();
  });

  const renderCatalog = () => renderHook(() => usePlantsCatalog());

  const waitUntilLoaded = async (
    result: ReturnType<typeof renderCatalog>['result'],
  ): Promise<void> => {
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  };

  it('загружает растения и категории, пропуская пустую', async () => {
    api.list.mockResolvedValue([
      createPlant({ category: 'Яблоня' }),
      createPlant({ category: '', id: 'plant-2' }),
      createPlant({ category: 'Алоэ', id: 'plant-3' }),
    ]);

    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    expect(api.list).toHaveBeenCalledWith({
      categories: undefined,
      sort: 'watering',
    });
    expect(result.current.categoryOptions).toEqual(['Алоэ', 'Яблоня']);
    expect(result.current.error).toBeNull();
    expect(result.current.plants).toHaveLength(3);
  });

  it('при фильтре запрашивает и отфильтрованный, и полный список', async () => {
    api.list.mockImplementation((params?: ListPlantsParams) => {
      if (params?.categories) {
        return Promise.resolve([createPlant({ category: 'Алоэ' })]);
      }

      return Promise.resolve([
        createPlant({ category: 'Алоэ' }),
        createPlant({ category: 'Пальмы', id: 'plant-2' }),
      ]);
    });

    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    act(() => {
      result.current.setCategories(['Алоэ']);
    });

    await waitFor(() => {
      expect(result.current.plants).toHaveLength(1);
    });

    expect(result.current.categoryOptions).toEqual(['Алоэ', 'Пальмы']);
    expect(api.list).toHaveBeenCalledWith({
      categories: ['Алоэ'],
      sort: 'watering',
    });
  });

  it('показывает сообщение ApiError и запасной текст', async () => {
    api.list.mockRejectedValueOnce(new ApiError('Сеть', 500));

    const failed = renderCatalog();

    await waitUntilLoaded(failed.result);
    expect(failed.result.current.error).toBe('Сеть');

    api.list.mockRejectedValueOnce(new Error('boom'));

    const generic = renderCatalog();

    await waitUntilLoaded(generic.result);
    expect(generic.result.current.error).toBe('Не удалось загрузить каталог');

    api.list.mockRejectedValueOnce('x');

    const unknown = renderCatalog();

    await waitUntilLoaded(unknown.result);
    expect(unknown.result.current.error).toBe('Не удалось загрузить каталог');
  });

  it('перезагружает каталог при смене сортировки и reload', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    act(() => {
      result.current.setSort('fertilizing');
    });

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith({
        categories: undefined,
        sort: 'fertilizing',
      });
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.loading).toBe(false);
  });

  it('отмечает полив и оставляет список, если растения нет', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    api.water.mockResolvedValueOnce(createPlant({ name: 'После полива' }));

    await act(async () => {
      await result.current.waterPlant('plant-1');
    });

    expect(result.current.plants[0]?.name).toBe('После полива');
    expect(messages.success).toHaveBeenCalledWith('Полив отмечен');

    const before = result.current.plants;

    api.water.mockResolvedValueOnce(createPlant({ id: 'missing' }));

    await act(async () => {
      await result.current.waterPlant('missing');
    });

    expect(result.current.plants).toBe(before);
  });

  it('сообщает об ошибке полива', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    api.water.mockRejectedValueOnce(new ApiError('Уже полито', 409));

    await act(async () => {
      await result.current.waterPlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith('Уже полито');

    api.water.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      await result.current.waterPlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith('Не удалось отметить полив');
  });

  it('отмечает подкормку и сообщает об ошибке', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    api.fertilize.mockResolvedValueOnce(createPlant({ name: 'Подкормлено' }));

    await act(async () => {
      await result.current.fertilizePlant('plant-1');
    });

    expect(result.current.plants[0]?.name).toBe('Подкормлено');
    expect(messages.success).toHaveBeenCalledWith('Подкормка отмечена');

    api.fertilize.mockResolvedValueOnce(createPlant({ id: 'missing' }));

    await act(async () => {
      await result.current.fertilizePlant('missing');
    });

    api.fertilize.mockRejectedValueOnce(new ApiError('Нет', 404));

    await act(async () => {
      await result.current.fertilizePlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith('Нет');

    api.fertilize.mockRejectedValueOnce('x');

    await act(async () => {
      await result.current.fertilizePlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith(
      'Не удалось отметить подкормку',
    );
  });

  it('удаляет растение и обновляет список', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);
    api.list.mockResolvedValueOnce([]);
    api.delete.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.deletePlant('plant-1');
    });

    expect(api.delete).toHaveBeenCalledWith('plant-1');
    expect(result.current.plants).toEqual([]);
    expect(messages.success).toHaveBeenCalledWith('Растение удалено');
  });

  it('сообщает об ошибке удаления', async () => {
    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    api.delete.mockRejectedValueOnce(new ApiError('Запрещено', 403));

    await act(async () => {
      await result.current.deletePlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith('Запрещено');

    api.delete.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      await result.current.deletePlant('plant-1');
    });

    expect(messages.error).toHaveBeenCalledWith('Не удалось удалить растение');
  });

  it('делегирует оценку состояния', async () => {
    const condition = {
      assessment: 'Норма',
      healthLevel: 'poor' as const,
      recommendations: ['Опрыскать'],
    };

    api.assessConditionById.mockResolvedValue(condition);

    const { result } = renderCatalog();

    await waitUntilLoaded(result);

    await expect(result.current.assessPlant('plant-1')).resolves.toEqual(
      condition,
    );
    expect(api.assessConditionById).toHaveBeenCalledWith('plant-1');
  });
});
