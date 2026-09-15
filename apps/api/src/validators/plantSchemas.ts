import { z } from 'zod';

import type { PlantSort } from '../types/plant.js';

const positiveInt = z.coerce.number().int().min(1);

const plantFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно'),
  description: z.string().default(''),
  category: z.string().default(''),
  lightPreference: z.string().default(''),
  sizeInfo: z.string().default(''),
  wateringIntervalDays: positiveInt,
  fertilizingIntervalDays: positiveInt,
  wateringNotes: z.string().default(''),
  fertilizingNotes: z.string().default(''),
  lastWateredAt: z.coerce.date(),
  lastFertilizedAt: z.coerce.date(),
});

export const createPlantSchema = plantFieldsSchema;

export const updatePlantSchema = plantFieldsSchema.partial();

export const listPlantsQuerySchema = z.object({
  sort: z.enum(['watering', 'fertilizing']).default('watering'),
  category: z.string().optional(),
});

export function parseCreatePlantBody(
  body: Record<string, unknown>,
): z.infer<typeof createPlantSchema> {
  return createPlantSchema.parse(body);
}

export function parseUpdatePlantBody(
  body: Record<string, unknown>,
): z.infer<typeof updatePlantSchema> {
  return updatePlantSchema.parse(body);
}

export function parseListPlantsQuery(query: Record<string, unknown>): {
  sort: PlantSort;
  category?: string;
} {
  const parsed = listPlantsQuerySchema.parse(query);

  if (parsed.category === undefined || parsed.category === '') {
    return { sort: parsed.sort };
  }

  return { sort: parsed.sort, category: parsed.category };
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
