import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  conditionResult,
  deferred,
  imageFile,
  quietMessage,
} from '../../../test/fixtures';
import { renderUi } from '../../../test/render';
import { PlantImageGallery } from '../PlantImageGallery';

const image = (
  id: string,
  isDefault = false,
): {
  id: string;
  isCover: boolean;
  isDefault: boolean;
  previewSrc: string;
  src: string;
} => {
  return {
    id,
    isCover: isDefault,
    isDefault,
    previewSrc: `/full/${id}.jpg`,
    src: `/thumb/${id}.jpg`,
  };
};

const fileInput = (): HTMLInputElement => {
  const input = document.querySelector('input[type="file"]');

  expect(input).toBeInstanceOf(HTMLInputElement);

  return input as HTMLInputElement;
};

describe('PlantImageGallery', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(quietMessage);
  });

  it('не даёт удалить единственное фото', () => {
    const { container } = renderUi(
      <PlantImageGallery
        images={[image('only', true)]}
        onAddFiles={vi.fn()}
        onAssess={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeDisabled();
  });

  it('назначает, сбрасывает и удаляет фото', async () => {
    const user = userEvent.setup();
    const pending = deferred<void>();
    const onSetDefault = vi.fn(() => pending.promise);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onAssess = vi.fn().mockResolvedValue(conditionResult());

    renderUi(
      <PlantImageGallery
        images={[image('cover', true), image('side')]}
        onAddFiles={vi.fn()}
        onAssess={onAssess}
        onDelete={onDelete}
        onSetDefault={onSetDefault}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'По умолчанию' }));
    expect(onSetDefault).toHaveBeenCalledWith('side');
    expect(
      screen.getByRole('button', { name: /Добавить фото/ }),
    ).toBeDisabled();

    pending.resolve();

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(onSetDefault).toHaveBeenCalledWith(null);

    await user.click(screen.getAllByRole('button', { name: 'Удалить' })[0]!);
    await user.click(
      screen.getAllByRole('button', { name: 'Удалить' }).at(-1)!,
    );
    expect(onDelete).toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: 'Состояние' })[0]!);
    expect(await screen.findByText('Листья упругие')).toBeTruthy();
    expect(onAssess).toHaveBeenCalled();
  });

  it('добавляет только подходящие файлы и пишет ошибку по имени', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onAddFiles = vi.fn().mockResolvedValue(undefined);

    const disabled = renderUi(
      <PlantImageGallery
        disabled
        images={[image('cover', true), image('side')]}
        onAddFiles={onAddFiles}
        onAssess={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );

    expect(disabled.container).toMatchSnapshot();
    expect(fileInput()).toBeDisabled();
    disabled.unmount();

    const enabled = renderUi(
      <PlantImageGallery
        images={[image('cover', true)]}
        onAddFiles={onAddFiles}
        onAssess={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );

    await user.upload(fileInput(), [
      imageFile('ok.jpg'),
      imageFile('bad.gif', 'image/gif'),
    ]);

    expect(message.error).toHaveBeenCalledWith(
      'bad.gif: Допустимы только JPEG, PNG и WebP',
    );
    expect(onAddFiles).toHaveBeenCalledOnce();
    enabled.unmount();
  });
});
