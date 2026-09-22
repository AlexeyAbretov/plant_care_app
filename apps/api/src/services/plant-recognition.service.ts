import { chatWithImage } from './ollama.client.js';

import {
  PLANT_RECOGNITION_RETRY_PROMPT,
  PLANT_RECOGNITION_SYSTEM_PROMPT,
  PLANT_RECOGNITION_USER_PROMPT,
} from '../prompts/plant-recognition.prompt.js';
import {
  type PlantRecognitionResult,
  plantRecognitionSchema,
} from '../schemas/plant-recognition.schema.js';
import { intervalDaysFromNotes } from '../utils/careIntervalFromNotes.js';
import { extractJson } from '../utils/extract-json.js';

export class PlantRecognitionError extends Error {
  constructor(message = 'Не удалось распознать растение') {
    super(message);
    this.name = 'PlantRecognitionError';
  }
}

export class InvalidImageFormatError extends Error {
  constructor(message = 'Неподдерживаемый формат изображения') {
    super(message);
    this.name = 'InvalidImageFormatError';
  }
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateImageMime(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

function parseRecognitionContent(content: string): PlantRecognitionResult {
  const jsonText = extractJson(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new PlantRecognitionError();
  }

  const result = plantRecognitionSchema.safeParse(parsed);

  if (!result.success) {
    throw new PlantRecognitionError();
  }

  const { wateringNotes, fertilizingNotes } = result.data;

  return {
    ...result.data,
    wateringIntervalDays:
      intervalDaysFromNotes(wateringNotes) ?? result.data.wateringIntervalDays,
    fertilizingIntervalDays:
      intervalDaysFromNotes(fertilizingNotes) ??
      result.data.fertilizingIntervalDays,
  };
}

export async function recognizePlantFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PlantRecognitionResult> {
  if (!validateImageMime(mimeType)) {
    throw new InvalidImageFormatError();
  }

  const imageBase64 = imageBuffer.toString('base64');

  const firstResponse = await chatWithImage({
    systemPrompt: PLANT_RECOGNITION_SYSTEM_PROMPT,
    userPrompt: PLANT_RECOGNITION_USER_PROMPT,
    imageBase64,
  });

  try {
    return parseRecognitionContent(firstResponse);
  } catch {
    const retryUserPrompt = [
      PLANT_RECOGNITION_USER_PROMPT,
      PLANT_RECOGNITION_RETRY_PROMPT,
    ].join('\n\n');

    const retryResponse = await chatWithImage({
      systemPrompt: PLANT_RECOGNITION_SYSTEM_PROMPT,
      userPrompt: retryUserPrompt,
      imageBase64,
    });

    return parseRecognitionContent(retryResponse);
  }
}
