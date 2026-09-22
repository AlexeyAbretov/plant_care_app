import type {
  CreatePlantPayload,
  ListPlantsParams,
  Plant,
  PlantConditionResult,
  PlantRecognizeResult,
  UpdatePlantPayload,
} from '@types';

import { type ApiClient, apiClient } from '../ApiClient';

export class PlantsApi {
  constructor(private readonly client: ApiClient) {}

  async assessCondition(file: File): Promise<PlantConditionResult> {
    const formData = new FormData();

    formData.append('image', file);

    return this.client.fetchJson<PlantConditionResult>(
      '/api/plants/assess-condition',
      {
        method: 'POST',
        body: formData,
      },
    );
  }

  async assessConditionById(id: string): Promise<PlantConditionResult> {
    return this.client.fetchJson<PlantConditionResult>(
      `/api/plants/${id}/assess-condition`,
      { method: 'POST' },
    );
  }

  async recognize(file: File): Promise<PlantRecognizeResult> {
    const formData = new FormData();

    formData.append('image', file);

    return this.client.fetchJson<PlantRecognizeResult>(
      '/api/plants/recognize',
      {
        method: 'POST',
        body: formData,
      },
    );
  }

  async create(payload: CreatePlantPayload, file: File): Promise<Plant> {
    const formData = new FormData();

    this.appendFields(formData, payload);
    formData.append('image', file);

    return this.client.fetchJson<Plant>('/api/plants', {
      method: 'POST',
      body: formData,
    });
  }

  async list(params?: ListPlantsParams): Promise<Plant[]> {
    return this.client.fetchJson<Plant[]>(this.plantsQuery(params));
  }

  async get(id: string): Promise<Plant> {
    return this.client.fetchJson<Plant>(`/api/plants/${id}`);
  }

  async water(id: string): Promise<Plant> {
    return this.client.fetchJson<Plant>(`/api/plants/${id}/water`, {
      method: 'PATCH',
    });
  }

  async fertilize(id: string): Promise<Plant> {
    return this.client.fetchJson<Plant>(`/api/plants/${id}/fertilize`, {
      method: 'PATCH',
    });
  }

  async update(
    id: string,
    payload: UpdatePlantPayload,
    imageFile?: File,
  ): Promise<Plant> {
    if (imageFile !== undefined) {
      const formData = new FormData();

      this.appendFields(formData, payload);
      formData.append('image', imageFile);

      return this.client.fetchJson<Plant>(`/api/plants/${id}`, {
        method: 'PATCH',
        body: formData,
      });
    }

    return this.client.fetchJson<Plant>(`/api/plants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.request(`/api/plants/${id}`, { method: 'DELETE' });
  }

  private appendFields(formData: FormData, payload: CreatePlantPayload): void {
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('category', payload.category);
    formData.append('lightPreference', payload.lightPreference);
    formData.append('sizeInfo', payload.sizeInfo);
    formData.append('locationKind', payload.locationKind);
    formData.append(
      'wateringIntervalDays',
      String(payload.wateringIntervalDays),
    );
    formData.append(
      'fertilizingIntervalDays',
      String(payload.fertilizingIntervalDays),
    );
    formData.append('wateringNotes', payload.wateringNotes);
    formData.append('fertilizingNotes', payload.fertilizingNotes);
    formData.append('lastWateredAt', payload.lastWateredAt);
    formData.append('lastFertilizedAt', payload.lastFertilizedAt);
  }

  private plantsQuery(params?: ListPlantsParams): string {
    const searchParams = new URLSearchParams();

    if (params?.sort !== undefined) {
      searchParams.set('sort', params.sort);
    }

    if (params?.categories !== undefined) {
      for (const item of params.categories) {
        if (item !== '') {
          searchParams.append('category', item);
        }
      }
    }

    const query = searchParams.toString();

    return query === '' ? '/api/plants' : `/api/plants?${query}`;
  }
}

export const plantsApi = new PlantsApi(apiClient);
