import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../ImageUpload';

export const getImageValidationError = (file: File): string | null => {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return 'Допустимы только JPEG, PNG и WebP';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Размер файла не должен превышать 5 МБ';
  }

  return null;
};
