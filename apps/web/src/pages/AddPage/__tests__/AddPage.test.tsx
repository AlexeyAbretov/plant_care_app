import {
  conditionResult,
  createPlant,
  deferred,
  imageFile,
  recognizeResult,
} from '@test/fixtures';
import { pathname, renderUi } from '@test/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@api';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddPage } from '../AddPage';

const api = vi.hoisted(() => ({
  assessCondition: vi.fn(),
  create: vi.fn(),
  recognize: vi.fn(),
}));

vi.mock('@api', async () => {
  const actual = await vi.importActual<typeof import('@api')>('@api');

  return {
    ...actual,
    plantsApi: api,
  };
});

const fileInput = (): HTMLInputElement => {
  const input = document.querySelector('input[type="file"]');

  expect(input).toBeInstanceOf(HTMLInputElement);

  return input as HTMLInputElement;
};

describe('AddPage', () => {
  beforeEach(() => {
    api.assessCondition.mockReset();
    api.create.mockReset();
    api.recognize.mockReset();
    api.assessCondition.mockResolvedValue(conditionResult());
    api.create.mockResolvedValue(createPlant());
    api.recognize.mockResolvedValue(recognizeResult());
  });

  it('показывает шаг загрузки', () => {
    const { container } = renderUi(<AddPage />, { route: '/add' });

    expect(container).toMatchSnapshot();
    expect(
      screen.getByRole('button', { name: 'Распознать растение' }),
    ).toBeDisabled();
  });

  it('распознаёт фото, сохраняет растение и возвращает в каталог', async () => {
    const user = userEvent.setup();

    renderUi(<AddPage />, { route: '/add' });
    await user.upload(fileInput(), imageFile());
    await user.click(
      screen.getByRole('button', { name: 'Распознать растение' }),
    );

    expect(await screen.findByDisplayValue('Фикус')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(pathname()).toBe('/');
    });
    expect(api.create).toHaveBeenCalledOnce();
  });

  it('показывает распознавание, ручную форму и ошибки', async () => {
    const user = userEvent.setup();
    const pending = deferred<ReturnType<typeof recognizeResult>>();

    api.recognize.mockReturnValueOnce(pending.promise);

    const { container } = renderUi(<AddPage />, { route: '/add' });

    await user.upload(fileInput(), imageFile());
    await user.click(
      screen.getByRole('button', { name: 'Распознать растение' }),
    );
    expect(container).toMatchSnapshot();

    pending.reject(new ApiError('Модель недоступна', 503));
    expect(await screen.findByText('Модель недоступна')).toBeTruthy();

    api.recognize.mockRejectedValueOnce(new Error('boom'));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByText('Не удалось распознать растение'),
    ).toBeTruthy();

    const close = document.querySelector('.ant-alert-close-icon');

    expect(close).toBeInstanceOf(HTMLElement);
    await user.click(close as HTMLElement);

    await user.click(
      screen.getByRole('button', { name: 'Выбрать другое фото' }),
    );
    await user.click(screen.getByRole('button', { name: 'Заполнить вручную' }));
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeTruthy();
  });

  it('показывает ошибку сохранения и оценивает фото', async () => {
    const user = userEvent.setup();

    renderUi(<AddPage />, { route: '/add' });
    await user.upload(fileInput(), imageFile());
    await user.click(
      screen.getByRole('button', { name: 'Распознать растение' }),
    );
    expect(await screen.findByDisplayValue('Фикус')).toBeTruthy();

    api.create.mockRejectedValueOnce(new ApiError('Занято', 409));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText('Занято')).toBeTruthy();

    api.create.mockRejectedValueOnce('x');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByText('Не удалось сохранить растение'),
    ).toBeTruthy();

    const close = document.querySelector('.ant-alert-close-icon');

    expect(close).toBeInstanceOf(HTMLElement);
    await user.click(close as HTMLElement);
    expect(screen.queryByText('Не удалось сохранить растение')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Состояние' }));
    expect(await screen.findByText('Листья упругие')).toBeTruthy();
    expect(api.assessCondition).toHaveBeenCalledOnce();
  });

  it('распознаёт по названию и фото и затирает поля', async () => {
    const user = userEvent.setup();

    renderUi(<AddPage />, { route: '/add' });
    await user.upload(fileInput(), imageFile());
    await user.click(screen.getByRole('button', { name: 'Заполнить вручную' }));

    const recognize = screen.getByRole('button', { name: 'Распознать' });

    expect(recognize).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'На улице / балконе' }));
    await user.click(screen.getAllByPlaceholderText('Выберите дату')[0]);
    await user.click(await screen.findByTitle('2026-09-10'));
    await user.type(
      screen.getByPlaceholderText('Например, монстера'),
      'Монстера',
    );
    expect(recognize).toBeEnabled();

    await user.click(recognize);

    expect(await screen.findByDisplayValue('Фикус')).toBeTruthy();
    expect(screen.getByDisplayValue('Комнатное дерево')).toBeTruthy();
    expect(screen.getByDisplayValue('10.09.2026')).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: 'На улице / балконе' }),
    ).toBeChecked();
    expect(api.recognize).toHaveBeenCalledWith(expect.any(File), 'Монстера');
  });

  it('оставляет поля, если распознавание по имени не удалось', async () => {
    const user = userEvent.setup();

    renderUi(<AddPage />, { route: '/add' });
    await user.upload(fileInput(), imageFile());
    await user.click(screen.getByRole('button', { name: 'Заполнить вручную' }));
    await user.type(
      screen.getByPlaceholderText('Например, монстера'),
      'Монстера',
    );

    api.recognize.mockRejectedValueOnce(new ApiError('Модель недоступна', 503));
    await user.click(screen.getByRole('button', { name: 'Распознать' }));
    expect(await screen.findByText('Модель недоступна')).toBeTruthy();
    expect(screen.getByDisplayValue('Монстера')).toBeTruthy();

    api.recognize.mockRejectedValueOnce(new Error('boom'));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByText('Не удалось распознать растение'),
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Монстера')).toBeTruthy();
    expect(api.recognize).toHaveBeenLastCalledWith(
      expect.any(File),
      'Монстера',
    );
  });
});
