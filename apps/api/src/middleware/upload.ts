import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { ALLOWED_IMAGE_MIME_TYPES } from '../services/imageStorage.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    if (
      ALLOWED_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      callback(null, true);

      return;
    }

    callback(new Error('Недопустимый тип файла'));
  },
});

export const uploadPlantImage = upload.single('image');

export function handleUploadError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'Размер файла превышает 5 МБ' });

      return;
    }

    res.status(400).json({ error: error.message });

    return;
  }

  if (error instanceof Error && error.message === 'Недопустимый тип файла') {
    res.status(400).json({ error: error.message });

    return;
  }

  next(error);
}
