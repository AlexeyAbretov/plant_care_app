import { imageFile, quietMessage } from '@test/fixtures';
import { renderUi } from '@test/render';
import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import userEvent from '@testing-library/user-event';

import { ImageUpload, MAX_IMAGE_SIZE_BYTES } from '../ImageUpload';

const fileInput = (): HTMLInputElement => {
  const input = document.querySelector('input[type="file"]');

  expect(input).toBeInstanceOf(HTMLInputElement);

  return input as HTMLInputElement;
};

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(quietMessage);
  });

  it('показывает пустую зону и превью выбранного файла', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const empty = renderUi(
      <ImageUpload
        file={null}
        onFileSelect={onFileSelect}
        previewOriginalUrl={null}
        previewUrl={null}
      />,
    );

    expect(empty.container).toMatchSnapshot();

    await user.upload(fileInput(), imageFile('plant.webp', 'image/webp'));
    expect(onFileSelect).toHaveBeenCalledOnce();
    expect(onFileSelect.mock.calls[0]?.[0]).toMatchObject({
      name: 'plant.webp',
      type: 'image/webp',
    });
    empty.unmount();

    const preview = renderUi(
      <ImageUpload
        file={imageFile()}
        onFileSelect={onFileSelect}
        previewOriginalUrl="blob:full"
        previewUrl="blob:preview"
      />,
    );

    expect(preview.container).toMatchSnapshot();
  });

  it('отклоняет чужой тип и файл больше 5 МБ', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFileSelect = vi.fn();

    renderUi(
      <ImageUpload
        file={null}
        onFileSelect={onFileSelect}
        previewOriginalUrl={null}
        previewUrl={null}
      />,
    );

    await user.upload(fileInput(), imageFile('plant.gif', 'image/gif'));
    expect(message.error).toHaveBeenCalledWith(
      'Допустимы только JPEG, PNG и WebP',
    );

    await user.upload(
      fileInput(),
      imageFile('big.jpg', 'image/jpeg', MAX_IMAGE_SIZE_BYTES + 1),
    );
    expect(message.error).toHaveBeenCalledWith(
      'Размер файла не должен превышать 5 МБ',
    );
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('убирает файл и блокирует зону', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const { container } = renderUi(
      <ImageUpload
        disabled
        file={imageFile()}
        onFileSelect={onFileSelect}
        previewOriginalUrl={null}
        previewUrl={null}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(fileInput()).toBeDisabled();

    const enabled = renderUi(
      <ImageUpload
        file={imageFile()}
        onFileSelect={onFileSelect}
        previewOriginalUrl={null}
        previewUrl={null}
      />,
    );
    const remove = enabled.container.querySelector(
      '.ant-upload-list-item-action',
    );

    expect(remove).toBeInstanceOf(HTMLElement);

    await user.click(remove as HTMLElement);
    expect(onFileSelect).toHaveBeenCalledWith(null);
  });
});
