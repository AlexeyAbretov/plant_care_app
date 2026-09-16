import { getImageBuffer, ImageNotFoundError } from './imageStorage.js';
import { chatWithImage } from './ollama.client.js';
import {
  InvalidImageFormatError,
  validateImageMime,
} from './plant-recognition.service.js';
import { PlantNotFoundError } from './plantService.js';

import { PlantModel } from '../models/Plant.js';
import {
  PLANT_CONDITION_RETRY_PROMPT,
  PLANT_CONDITION_SYSTEM_PROMPT,
  PLANT_CONDITION_USER_PROMPT,
} from '../prompts/plant-condition.prompt.js';
import {
  type PlantConditionResult,
  plantConditionSchema,
} from '../schemas/plant-condition.schema.js';
import { extractJson } from '../utils/extract-json.js';

export class PlantConditionError extends Error {
  constructor(message = 'Не удалось оценить состояние растения') {
    super(message);
    this.name = 'PlantConditionError';
  }
}

function parseConditionContent(content: string): PlantConditionResult {
  const jsonText = extractJson(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new PlantConditionError();
  }

  const result = plantConditionSchema.safeParse(parsed);

  if (!result.success) {
    throw new PlantConditionError();
  }

  return result.data;
}

async function assessFromBuffer(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PlantConditionResult> {
  if (!validateImageMime(mimeType)) {
    throw new InvalidImageFormatError();
  }

  const imageBase64 = imageBuffer.toString('base64');

  const firstResponse = await chatWithImage({
    systemPrompt: PLANT_CONDITION_SYSTEM_PROMPT,
    userPrompt: PLANT_CONDITION_USER_PROMPT,
    imageBase64,
  });

  try {
    return parseConditionContent(firstResponse);
  } catch {
    const retryUserPrompt = [
      PLANT_CONDITION_USER_PROMPT,
      PLANT_CONDITION_RETRY_PROMPT,
    ].join('\n\n');

    const retryResponse = await chatWithImage({
      systemPrompt: PLANT_CONDITION_SYSTEM_PROMPT,
      userPrompt: retryUserPrompt,
      imageBase64,
    });

    return parseConditionContent(retryResponse);
  }
}

export async function assessPlantConditionFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PlantConditionResult> {
  return assessFromBuffer(imageBuffer, mimeType);
}

export async function assessPlantConditionByPlantId(
  id: string,
): Promise<PlantConditionResult> {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  try {
    const { buffer, contentType } = await getImageBuffer(plant.imageFileId);

    return assessFromBuffer(buffer, contentType);
  } catch (error) {
    if (error instanceof ImageNotFoundError) {
      throw new PlantNotFoundError();
    }

    throw error;
  }
}
