import multer from 'multer';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});
