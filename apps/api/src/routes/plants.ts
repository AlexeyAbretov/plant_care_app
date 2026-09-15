import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { z } from 'zod';

import { handleUploadError, uploadPlantImage } from '../middleware/upload.js';
import {
  type ImageMimeType,
  ImageNotFoundError,
} from '../services/imageStorage.js';
import {
  OllamaTimeoutError,
  OllamaUnavailableError,
} from '../services/ollama.client.js';
import {
  InvalidImageFormatError,
  PlantRecognitionError,
  recognizePlantFromImage,
} from '../services/plant-recognition.service.js';
import {
  createPlant,
  deletePlant,
  fertilizePlant,
  getPlantById,
  getPlantImage,
  listPlants,
  PlantNotFoundError,
  updatePlant,
  waterPlant,
} from '../services/plantService.js';
import { getRouteParam, parseObjectId } from '../utils/objectId.js';
import {
  formatZodError,
  parseCreatePlantBody,
  parseListPlantsQuery,
  parseUpdatePlantBody,
} from '../validators/plantSchemas.js';

export const plantsRouter = Router();

function getImageFromRequest(req: Request) {
  if (!req.file) {
    return undefined;
  }

  return {
    buffer: req.file.buffer,
    mimetype: req.file.mimetype as ImageMimeType,
    originalname: req.file.originalname,
  };
}

function handleRouteError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: formatZodError(error) });

    return;
  }

  if (error instanceof PlantNotFoundError) {
    res.status(404).json({ error: error.message });

    return;
  }

  if (error instanceof ImageNotFoundError) {
    res.status(404).json({ error: error.message });

    return;
  }

  next(error);
}

function withUpload(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadPlantImage(req, res, (error) => {
      if (error) {
        handleUploadError(error, req, res, next);

        return;
      }

      handler(req, res).catch((handlerError) => {
        handleRouteError(handlerError, res, next);
      });
    });
  };
}

plantsRouter.post('/recognize', (req, res, next) => {
  uploadPlantImage(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res, next);

      return;
    }

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
      } catch (recognizeError: unknown) {
        if (recognizeError instanceof InvalidImageFormatError) {
          res.status(400).json({ error: recognizeError.message });

          return;
        }

        if (recognizeError instanceof PlantRecognitionError) {
          res.status(502).json({ error: recognizeError.message });

          return;
        }

        if (recognizeError instanceof OllamaUnavailableError) {
          res.status(503).json({ error: recognizeError.message });

          return;
        }

        if (recognizeError instanceof OllamaTimeoutError) {
          res.status(504).json({ error: recognizeError.message });

          return;
        }

        next(recognizeError);
      }
    })().catch(next);
  });
});

plantsRouter.post(
  '/',
  withUpload(async (req, res) => {
    const image = getImageFromRequest(req);

    if (!image) {
      res.status(400).json({ error: 'Изображение обязательно' });

      return;
    }

    const fields = parseCreatePlantBody(req.body);
    const plant = await createPlant(fields, image);

    res.status(201).json(plant);
  }),
);

plantsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = parseListPlantsQuery(req.query as Record<string, unknown>);
      const plants = await listPlants(query);

      res.json(plants);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.patch(
  '/:id/water',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const plant = await waterPlant(id);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.patch(
  '/:id/fertilize',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const plant = await fertilizePlant(id);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.get(
  '/:id/image',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const { stream, contentType } = await getPlantImage(id, 'original');

      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.get(
  '/:id/thumbnail',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const { stream, contentType } = await getPlantImage(id, 'thumbnail');

      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const plant = await getPlantById(id);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.patch(
  '/:id',
  withUpload(async (req, res) => {
    const id = getRouteParam(req, 'id');

    if (!parseObjectId(id)) {
      res.status(404).json({ error: 'Растение не найдено' });

      return;
    }

    const fields = parseUpdatePlantBody(req.body);
    const image = getImageFromRequest(req);
    const plant = await updatePlant(id, fields, image);

    res.json(plant);
  }),
);

plantsRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      await deletePlant(id);

      res.status(204).send();
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);
