import {
  createPlant,
  deferred,
  imageFile,
  plantImage,
  quietMessage,
} from '@test/fixtures';
import { pathname, renderUi } from '@test/render';
import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@api';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Plant } from '@types';

import { EditPlantPage } from '../EditPlantPage';

const api = vi.hoisted(() => ({
  addImages: vi.fn(),
  assessConditionByImageId: vi.fn(),
  delete: vi.fn(),
  deleteImage: vi.fn(),
  get: vi.fn(),
  setDefaultImage: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@api', async () => {
  const actual = await vi.importActual<typeof import('@api')>('@api');

  return {
    ...actual,
    plantsApi: api,
  };
});

const loadedPlant = (): Plant => {
  return createPlant({
    images: [
      plantImage('img-1'),
      { ...plantImage('img-2'), isCover: false, isDefault: false },
    ],
  });
};

const renderEdit = (id = 'plant-1') => {
  return renderUi(<EditPlantPage />, {
    path: '/plants/:id/edit',
    route: `/plants/${id}/edit`,
  });
};

describe('EditPlantPage', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.update.mockReset();
    api.addImages.mockReset();
    api.deleteImage.mockReset();
    api.setDefaultImage.mockReset();
    api.delete.mockReset();
    api.assessConditionByImageId.mockReset();
    api.get.mockResolvedValue(loadedPlant());
    api.update.mockResolvedValue(loadedPlant());
    api.addImages.mockResolvedValue(loadedPlant());
    api.deleteImage.mockResolvedValue(loadedPlant());
    api.setDefaultImage.mockResolvedValue(loadedPlant());
    api.delete.mockResolvedValue(undefined);
    api.assessConditionByImageId.mockResolvedValue({
      assessment: 'Норма',
      healthLevel: 'good',
      recommendations: [],
    });
    vi.spyOn(message, 'success').mockImplementation(quietMessage);
    vi.spyOn(message, 'error').mockImplementation(quietMessage);
  });

  it('показывает загрузку, отсутствие id и ответы об ошибке', async () => {
    api.get.mockReturnValue(new Promise(() => {}));

    const loading = renderEdit();

    expect(loading.container).toMatchSnapshot();
    loading.unmount();
    api.get.mockClear();

    const missing = renderUi(<EditPlantPage />, {
      path: '/edit',
      route: '/edit',
    });

    expect(await screen.findByText('Растение не найдено')).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
    expect(missing.container).toMatchSnapshot();
    missing.unmount();

    api.get.mockRejectedValueOnce(new ApiError('Нет', 404));
    const notFound = renderEdit();

    expect(await screen.findByText('Растение не найдено')).toBeTruthy();
    notFound.unmount();

    api.get.mockRejectedValueOnce(new ApiError('Сбой', 500));
    const http = renderEdit();

    expect(await screen.findByText('Сбой')).toBeTruthy();
    expect(http.container).toMatchSnapshot();
    http.unmount();

    api.get.mockRejectedValueOnce(new Error('boom'));
    const generic = renderEdit();

    expect(
      await screen.findByText('Не удалось загрузить растение'),
    ).toBeTruthy();
    generic.unmount();

    api.get.mockRejectedValueOnce('x');
    const unknown = renderEdit();

    expect(
      await screen.findByText('Не удалось загрузить растение'),
    ).toBeTruthy();
    unknown.unmount();
  });

  it('не записывает растение после размонтирования', async () => {
    const pending = deferred<Plant>();

    api.get.mockReturnValue(pending.promise);

    const { unmount } = renderEdit();

    unmount();

    await Promise.resolve();
    pending.resolve(loadedPlant());
    await Promise.resolve();
  });

  it('не показывает ошибку загрузки после размонтирования', async () => {
    const pending = deferred<Plant>();

    api.get.mockReturnValue(pending.promise);

    const { unmount } = renderEdit();

    unmount();
    pending.reject(new Error('boom'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('сохраняет, отменяет и показывает ошибку сохранения', async () => {
    const user = userEvent.setup();
    const view = renderEdit();

    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();
    expect(view.container).toMatchSnapshot();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(pathname()).toBe('/');
    view.unmount();

    api.update.mockRejectedValueOnce(new ApiError('Конфликт', 409));

    renderEdit();

    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText('Конфликт')).toBeTruthy();

    api.update.mockRejectedValueOnce(new Error('boom'));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByText('Не удалось обновить растение'),
    ).toBeTruthy();

    const close = document.querySelector('.ant-alert-close-icon');

    expect(close).toBeInstanceOf(HTMLElement);
    await user.click(close as HTMLElement);
    expect(screen.queryByText('Не удалось обновить растение')).toBeNull();

    api.update.mockResolvedValueOnce(loadedPlant());
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(pathname()).toBe('/');
    });
  });

  it('меняет галерею и удаляет растение', async () => {
    const user = userEvent.setup();

    renderEdit();
    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'По умолчанию' }));
    await waitFor(() => {
      expect(api.setDefaultImage).toHaveBeenCalledWith('plant-1', 'img-2');
    });
    expect(message.success).toHaveBeenCalledWith('Фото по умолчанию обновлено');

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    await waitFor(() => {
      expect(api.setDefaultImage).toHaveBeenCalledWith('plant-1', null);
    });
    expect(message.success).toHaveBeenCalledWith(
      'На плитке снова последнее фото',
    );

    api.setDefaultImage.mockRejectedValueOnce(new ApiError('Не вышло', 500));
    await user.click(screen.getByRole('button', { name: 'По умолчанию' }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Не вышло');
    });

    api.setDefaultImage.mockRejectedValueOnce(new Error('boom'));
    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(
        'Не удалось обновить фото по умолчанию',
      );
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, imageFile());
    await waitFor(() => {
      expect(api.addImages).toHaveBeenCalled();
    });
    expect(message.success).toHaveBeenCalledWith('Фото добавлено');

    const gallery = document.querySelector('.plant-image-gallery');

    expect(gallery).toBeInstanceOf(HTMLElement);

    const deleteButtons = gallery?.querySelectorAll('button') ?? [];
    const photoDelete = [...deleteButtons].find((button) => {
      return button.textContent === 'Удалить';
    });

    expect(photoDelete).toBeInstanceOf(HTMLElement);
    await user.click(photoDelete as HTMLElement);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );

    await waitFor(() => {
      expect(api.deleteImage).toHaveBeenCalled();
    });
    expect(message.success).toHaveBeenCalledWith('Фото удалено');

    api.deleteImage.mockRejectedValueOnce(new ApiError('Нельзя', 400));
    await user.click(photoDelete as HTMLElement);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Нельзя');
    });

    await user.click(screen.getAllByRole('button', { name: 'Состояние' })[0]!);
    expect(api.assessConditionByImageId).toHaveBeenCalled();

    const plantDelete = screen
      .getAllByRole('button', { name: 'Удалить' })
      .find((button) => button.closest('.plant-image-gallery') === null);

    expect(plantDelete).toBeInstanceOf(HTMLElement);
    await user.click(plantDelete as HTMLElement);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );

    await waitFor(() => {
      expect(pathname()).toBe('/');
    });
    expect(message.success).toHaveBeenCalledWith('Растение удалено');
  });

  it('сообщает об ошибке удаления растения', async () => {
    const user = userEvent.setup();

    api.delete.mockRejectedValueOnce(new ApiError('Запрещено', 403));
    renderEdit();
    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();

    const plantDelete = screen
      .getAllByRole('button', { name: 'Удалить' })
      .find((button) => button.closest('.plant-image-gallery') === null);

    await user.click(plantDelete as HTMLElement);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Запрещено');
    });

    api.delete.mockRejectedValueOnce('x');
    await user.click(plantDelete as HTMLElement);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Не удалось удалить растение');
    });
  });

  it('сообщает, что добавлено несколько фото', async () => {
    const user = userEvent.setup();

    renderEdit();
    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();

    const input = document.querySelector('input[type="file"]');

    expect(input).toBeInstanceOf(HTMLInputElement);
    await user.upload(input as HTMLInputElement, [
      imageFile('a.jpg'),
      imageFile('b.jpg'),
    ]);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('Фото добавлены');
    });
  });

  it('сообщает об ошибке добавления фото', async () => {
    const user = userEvent.setup();

    api.addImages.mockRejectedValueOnce(new Error('boom'));
    renderEdit();
    expect(await screen.findByDisplayValue('Монстера')).toBeTruthy();

    const input = document.querySelector('input[type="file"]');

    expect(input).toBeInstanceOf(HTMLInputElement);
    await user.upload(input as HTMLInputElement, imageFile('c.jpg'));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Не удалось добавить фото');
    });
  });
});
