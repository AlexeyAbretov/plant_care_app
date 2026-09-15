import { z } from 'zod';

export const plantRecognitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  lightPreference: z.string().min(1),
  sizeInfo: z.string().min(1),
  wateringIntervalDays: z.number().int().min(1),
  fertilizingIntervalDays: z.number().int().min(1),
  wateringNotes: z.string().min(1),
  fertilizingNotes: z.string().min(1),
});

export type PlantRecognitionResult = z.infer<typeof plantRecognitionSchema>;
