import { z } from 'zod';

export const plantConditionSchema = z.object({
  assessment: z.string().min(1),
  healthLevel: z.enum(['good', 'fair', 'poor']),
  recommendations: z.array(z.string().min(1)).min(1),
});

export type PlantConditionResult = z.infer<typeof plantConditionSchema>;
