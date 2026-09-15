import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';

import { uploadImage } from '../middleware/upload.middleware.js';
import {
  OllamaTimeoutError,
  OllamaUnavailableError,
} from '../services/ollama.client.js';
import {
  InvalidImageFormatError,
  PlantRecognitionError,
  recognizePlantFromImage,
} from '../services/plant-recognition.service.js';

export const plantsRouter = Router();

function handleRecognize(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Файл изображения не передан' });
      return;
    }

    try {
      const result = await recognizePlantFromImage(
        file.buffer,
        file.mimetype,
      );

      res.json(result);
    } catch (error: unknown) {
      if (error instanceof InvalidImageFormatError) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof PlantRecognitionError) {
        res.status(502).json({ error: error.message });
        return;
      }

      if (error instanceof OllamaUnavailableError) {
        res.status(503).json({ error: error.message });
        return;
      }

      if (error instanceof OllamaTimeoutError) {
        res.status(504).json({ error: error.message });
        return;
      }

      next(error);
    }
  })().catch(next);
}

function handleUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadImage.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Размер файла превышает 5 МБ' });
        return;
      }

      res.status(400).json({ error: 'Ошибка загрузки файла' });
      return;
    }

    if (err) {
      next(err);
      return;
    }

    handleRecognize(req, res, next);
  });
}

plantsRouter.post('/recognize', handleUpload);
