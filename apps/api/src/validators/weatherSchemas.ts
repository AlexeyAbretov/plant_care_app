import { z } from 'zod';

import type { WeatherQuery } from '../types/weather.js';

const optionalCity = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') {
      return undefined;
    }

    return value;
  });

export const weatherQuerySchema = z
  .object({
    city: optionalCity,
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
  })
  .superRefine((value, ctx) => {
    const hasLat = value.lat !== undefined;
    const hasLon = value.lon !== undefined;

    if (hasLat !== hasLon) {
      ctx.addIssue({
        code: 'custom',
        message: 'Укажите и широту (lat), и долготу (lon)',
      });
    }
  });

export function parseWeatherQuery(
  query: Record<string, unknown>,
): WeatherQuery {
  return weatherQuerySchema.parse(query);
}
