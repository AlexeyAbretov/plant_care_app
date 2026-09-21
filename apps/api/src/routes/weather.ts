import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { z } from 'zod';

import {
  getWeather,
  WeatherNotFoundError,
  WeatherUnavailableError,
} from '../services/weather.service.js';
import { formatZodError } from '../validators/plantSchemas.js';
import { parseWeatherQuery } from '../validators/weatherSchemas.js';

export const weatherRouter = Router();

weatherRouter.get('/', (req, res, next) => {
  void handleGetWeather(req, res, next);
});

async function handleGetWeather(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = parseWeatherQuery(req.query as Record<string, unknown>);
    const weather = await getWeather(query);

    res.json(weather);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: formatZodError(error) });

      return;
    }

    if (error instanceof WeatherNotFoundError) {
      res.status(404).json({ error: error.message });

      return;
    }

    if (error instanceof WeatherUnavailableError) {
      res.status(502).json({ error: error.message });

      return;
    }

    next(error);
  }
}
