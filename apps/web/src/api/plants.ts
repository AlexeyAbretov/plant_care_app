import { ApiError, getApiUrl, parseApiError } from './client.js';

import type {
  CreatePlantPayload,
  Plant,
  PlantRecognizeResult,
} from '../types/plant.js';

function appendPlantFields(
  formData: FormData,
  payload: CreatePlantPayload,
): void {
  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('category', payload.category);
  formData.append('lightPreference', payload.lightPreference);
  formData.append('sizeInfo', payload.sizeInfo);
  formData.append('wateringIntervalDays', String(payload.wateringIntervalDays));
  formData.append(
    'fertilizingIntervalDays',
    String(payload.fertilizingIntervalDays),
  );
  formData.append('wateringNotes', payload.wateringNotes);
  formData.append('fertilizingNotes', payload.fertilizingNotes);
  formData.append('lastWateredAt', payload.lastWateredAt);
  formData.append('lastFertilizedAt', payload.lastFertilizedAt);
}

export async function recognizePlant(
  file: File,
): Promise<PlantRecognizeResult> {
  const formData = new FormData();

  formData.append('image', file);

  const response = await fetch(getApiUrl('/api/plants/recognize'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response), response.status);
  }

  return (await response.json()) as PlantRecognizeResult;
}

export async function createPlant(
  payload: CreatePlantPayload,
  file: File,
): Promise<Plant> {
  const formData = new FormData();

  appendPlantFields(formData, payload);
  formData.append('image', file);

  const response = await fetch(getApiUrl('/api/plants'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response), response.status);
  }

  return (await response.json()) as Plant;
}
