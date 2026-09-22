import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { z } from 'zod';

import {
  handleUploadError,
  uploadPlantImage,
  uploadPlantImages,
} from '../middleware/upload.js';
import {
  type ImageMimeType,
  ImageNotFoundError,
} from '../services/imageStorage.js';
import {
  OllamaTimeoutError,
  OllamaUnavailableError,
} from '../services/ollama.client.js';
import {
  assessPlantConditionByImageId,
  assessPlantConditionByPlantId,
  assessPlantConditionFromImage,
  PlantConditionError,
} from '../services/plant-condition.service.js';
import {
  InvalidImageFormatError,
  PlantRecognitionError,
  recognizePlantFromImage,
} from '../services/plant-recognition.service.js';
import {
  addPlantImages,
  createPlant,
  deletePlant,
  deletePlantImage,
  fertilizePlant,
  getPlantById,
  getPlantImage,
  LastPlantImageError,
  listPlants,
  PlantNotFoundError,
  setPlantDefaultImage,
  TooManyPlantImagesError,
  updatePlant,
  waterPlant,
} from '../services/plantService.js';
import { getRouteParam, parseObjectId } from '../utils/objectId.js';
import {
  formatZodError,
  parseCreatePlantBody,
  parseListPlantsQuery,
  parseSetDefaultImageBody,
  parseUpdatePlantBody,
} from '../validators/plantSchemas.js';

export const plantsRouter = Router();

function getImagesFromRequest(req: Request) {
  const files = req.files;

  if (!Array.isArray(files)) {
    return [];
  }

  return files.map((file) => {
    return {
      buffer: file.buffer,
      mimetype: file.mimetype as ImageMimeType,
      originalname: file.originalname,
    };
  });
}

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

  if (
    error instanceof LastPlantImageError ||
    error instanceof TooManyPlantImagesError
  ) {
    res.status(400).json({ error: error.message });

    return;
  }

  if (error instanceof ImageNotFoundError) {
    res.status(404).json({ error: error.message });

    return;
  }

  next(error);
}

function handleConditionError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof InvalidImageFormatError) {
    res.status(400).json({ error: error.message });

    return;
  }

  if (error instanceof PlantConditionError) {
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

function withImagesUpload(
  handler: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    uploadPlantImages(req, res, (error) => {
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

plantsRouter.post('/assess-condition', (req, res, next) => {
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
        const result = await assessPlantConditionFromImage(
          file.buffer,
          file.mimetype,
        );

        res.json(result);
      } catch (conditionError: unknown) {
        handleConditionError(conditionError, res, next);
      }
    })().catch(next);
  });
});

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
        const rawName = (req.body as { name?: unknown } | undefined)?.name;
        const nameHint = typeof rawName === 'string' ? rawName : undefined;
        const result = await recognizePlantFromImage(
          file.buffer,
          file.mimetype,
          nameHint,
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

plantsRouter.post(
  '/:id/assess-condition',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const result = await assessPlantConditionByPlantId(id);

      res.json(result);
    } catch (error) {
      if (error instanceof PlantNotFoundError) {
        res.status(404).json({ error: error.message });

        return;
      }

      handleConditionError(error, res, next);
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

plantsRouter.post(
  '/:id/images',
  withImagesUpload(async (req, res) => {
    const id = getRouteParam(req, 'id');

    if (!parseObjectId(id)) {
      res.status(404).json({ error: 'Растение не найдено' });

      return;
    }

    const images = getImagesFromRequest(req);

    if (images.length === 0) {
      res.status(400).json({ error: 'Файл изображения не передан' });

      return;
    }

    const plant = await addPlantImages(id, images);

    res.status(201).json(plant);
  }),
);

plantsRouter.delete(
  '/:id/images/:imageId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');
      const imageId = getRouteParam(req, 'imageId');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      if (!parseObjectId(imageId)) {
        res.status(404).json({ error: 'Изображение не найдено' });

        return;
      }

      const plant = await deletePlantImage(id, imageId);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.patch(
  '/:id/default-image',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const { imageId } = parseSetDefaultImageBody(req.body);

      if (imageId !== null && !parseObjectId(imageId)) {
        res.status(404).json({ error: 'Изображение не найдено' });

        return;
      }

      const plant = await setPlantDefaultImage(id, imageId);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.post(
  '/:id/images/:imageId/assess-condition',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');
      const imageId = getRouteParam(req, 'imageId');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      if (!parseObjectId(imageId)) {
        res.status(404).json({ error: 'Изображение не найдено' });

        return;
      }

      const result = await assessPlantConditionByImageId(id, imageId);

      res.json(result);
    } catch (error) {
      if (error instanceof PlantNotFoundError) {
        res.status(404).json({ error: error.message });

        return;
      }

      if (error instanceof ImageNotFoundError) {
        res.status(404).json({ error: error.message });

        return;
      }

      handleConditionError(error, res, next);
    }
  },
);

plantsRouter.get(
  '/:id/images/:imageId/thumbnail',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');
      const imageId = getRouteParam(req, 'imageId');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      if (!parseObjectId(imageId)) {
        res.status(404).json({ error: 'Изображение не найдено' });

        return;
      }

      const { stream, contentType } = await getPlantImage(
        id,
        'thumbnail',
        imageId,
      );

      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
);

plantsRouter.get(
  '/:id/images/:imageId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');
      const imageId = getRouteParam(req, 'imageId');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      if (!parseObjectId(imageId)) {
        res.status(404).json({ error: 'Изображение не найдено' });

        return;
      }

      const { stream, contentType } = await getPlantImage(
        id,
        'original',
        imageId,
      );

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getRouteParam(req, 'id');

      if (!parseObjectId(id)) {
        res.status(404).json({ error: 'Растение не найдено' });

        return;
      }

      const fields = parseUpdatePlantBody(req.body);
      const plant = await updatePlant(id, fields);

      res.json(plant);
    } catch (error) {
      handleRouteError(error, res, next);
    }
  },
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
