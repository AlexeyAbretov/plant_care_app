import { imageFile } from '@test/fixtures';
import { describe, expect, it } from 'vitest';

import { MAX_IMAGE_SIZE_BYTES } from '../../ImageUpload';
import { getImageValidationError } from '../PlantImageGallery.utils';

describe('getImageValidationError', () => {
  it('принимает jpeg, png и webp до 5 МБ', () => {
    expect(getImageValidationError(imageFile())).toBeNull();
    expect(getImageValidationError(imageFile('a.png', 'image/png'))).toBeNull();
    expect(
      getImageValidationError(imageFile('a.webp', 'image/webp')),
    ).toBeNull();
  });

  it('отклоняет чужой тип и слишком большой файл', () => {
    expect(getImageValidationError(imageFile('a.gif', 'image/gif'))).toBe(
      'Допустимы только JPEG, PNG и WebP',
    );
    expect(
      getImageValidationError(
        imageFile('big.jpg', 'image/jpeg', MAX_IMAGE_SIZE_BYTES + 1),
      ),
    ).toBe('Размер файла не должен превышать 5 МБ');
  });
});
