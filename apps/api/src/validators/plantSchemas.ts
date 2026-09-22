import { z } from 'zod';

import type { PlantSort } from '../types/plant.js';

const positiveInt = z.coerce.number().int().min(1);

const plantFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно'),
  description: z.string().default(''),
  category: z.string().default(''),
  lightPreference: z.string().default(''),
  sizeInfo: z.string().default(''),
  locationKind: z.enum(['indoor', 'outdoor']).default('indoor'),
  wateringIntervalDays: positiveInt,
  fertilizingIntervalDays: positiveInt,
  wateringNotes: z.string().default(''),
  fertilizingNotes: z.string().default(''),
  lastWateredAt: z.coerce.date(),
  lastFertilizedAt: z.coerce.date(),
});

export const createPlantSchema = plantFieldsSchema;

export const updatePlantSchema = plantFieldsSchema.partial();

const categoryQuerySchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    const items = Array.isArray(value) ? value : [value];

    return items.map((item) => item.trim()).filter((item) => item !== '');
  });

export const listPlantsQuerySchema = z.object({
  sort: z.enum(['watering', 'fertilizing']).default('watering'),
  category: categoryQuerySchema,
});

export function parseCreatePlantBody(
  body: Record<string, unknown>,
): z.infer<typeof createPlantSchema> {
  return createPlantSchema.parse(body);
}

export const setDefaultImageSchema = z.object({
  imageId: z.string().trim().min(1).nullable(),
});

export function parseSetDefaultImageBody(
  body: unknown,
): z.infer<typeof setDefaultImageSchema> {
  return setDefaultImageSchema.parse(body);
}

export function parseUpdatePlantBody(
  body: Record<string, unknown>,
): z.infer<typeof updatePlantSchema> {
  return updatePlantSchema.parse(body);
}

export function parseListPlantsQuery(query: Record<string, unknown>): {
  sort: PlantSort;
  categories?: string[];
} {
  const parsed = listPlantsQuerySchema.parse(query);

  if (parsed.category === undefined || parsed.category.length === 0) {
    return { sort: parsed.sort };
  }

  return { sort: parsed.sort, categories: parsed.category };
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
