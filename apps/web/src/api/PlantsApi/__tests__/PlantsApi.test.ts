import { describe, expect, it, vi } from 'vitest';

import {
  createPlant,
  imageFile,
  recognizeResult,
} from '../../../test/fixtures';
import type { ApiClient } from '../../ApiClient';
import { PlantsApi, plantsApi } from '../PlantsApi';

const payload = {
  category: 'Декоративные',
  description: 'Описание',
  fertilizingIntervalDays: 14,
  fertilizingNotes: 'Весной',
  lastFertilizedAt: '2026-09-01',
  lastWateredAt: '2026-09-20',
  lightPreference: 'Свет',
  locationKind: 'outdoor' as const,
  name: 'Фикус',
  sizeInfo: 'Крупный',
  wateringIntervalDays: 7,
  wateringNotes: 'Редко',
};

const createApi = () => {
  const fetchJson = vi.fn();
  const request = vi.fn();
  const client = { fetchJson, request } as unknown as ApiClient;

  return { api: new PlantsApi(client), fetchJson, request };
};

describe('PlantsApi', () => {
  it('экспортирует клиент по умолчанию', () => {
    expect(plantsApi).toBeInstanceOf(PlantsApi);
  });

  it('отправляет фото на оценку и распознавание', async () => {
    const { api, fetchJson } = createApi();
    const file = imageFile();
    const condition = {
      assessment: 'Норма',
      healthLevel: 'fair',
      recommendations: [],
    };

    fetchJson
      .mockResolvedValueOnce(condition)
      .mockResolvedValueOnce(recognizeResult())
      .mockResolvedValueOnce(recognizeResult())
      .mockResolvedValueOnce(recognizeResult());

    await expect(api.assessCondition(file)).resolves.toEqual(condition);
    await expect(api.recognize(file)).resolves.toEqual(recognizeResult());
    await expect(api.recognize(file, '  Монстера  ')).resolves.toEqual(
      recognizeResult(),
    );
    await expect(api.recognize(file, '   ')).resolves.toEqual(
      recognizeResult(),
    );

    const assessBody = fetchJson.mock.calls[0]?.[1].body as FormData;
    const recognizeBody = fetchJson.mock.calls[1]?.[1].body as FormData;
    const namedBody = fetchJson.mock.calls[2]?.[1].body as FormData;
    const blankNameBody = fetchJson.mock.calls[3]?.[1].body as FormData;

    expect(fetchJson.mock.calls[0]?.[0]).toBe('/api/plants/assess-condition');
    expect(assessBody.get('image')).toBe(file);
    expect(fetchJson.mock.calls[1]?.[0]).toBe('/api/plants/recognize');
    expect(recognizeBody.get('image')).toBe(file);
    expect(recognizeBody.get('name')).toBeNull();
    expect(namedBody.get('name')).toBe('Монстера');
    expect(blankNameBody.get('name')).toBeNull();
  });

  it('создаёт растение и дописывает поля формы', async () => {
    const { api, fetchJson } = createApi();
    const file = imageFile();
    const plant = createPlant();

    fetchJson.mockResolvedValue(plant);

    await expect(api.create(payload, file)).resolves.toBe(plant);

    const body = fetchJson.mock.calls[0]?.[1].body as FormData;

    expect(fetchJson.mock.calls[0]?.[0]).toBe('/api/plants');
    expect(fetchJson.mock.calls[0]?.[1].method).toBe('POST');
    expect(body.get('name')).toBe('Фикус');
    expect(body.get('description')).toBe('Описание');
    expect(body.get('category')).toBe('Декоративные');
    expect(body.get('lightPreference')).toBe('Свет');
    expect(body.get('sizeInfo')).toBe('Крупный');
    expect(body.get('locationKind')).toBe('outdoor');
    expect(body.get('wateringIntervalDays')).toBe('7');
    expect(body.get('fertilizingIntervalDays')).toBe('14');
    expect(body.get('wateringNotes')).toBe('Редко');
    expect(body.get('fertilizingNotes')).toBe('Весной');
    expect(body.get('lastWateredAt')).toBe('2026-09-20');
    expect(body.get('lastFertilizedAt')).toBe('2026-09-01');
    expect(body.get('image')).toBe(file);
  });

  it('собирает query списка и пропускает пустые категории', async () => {
    const { api, fetchJson } = createApi();

    fetchJson.mockResolvedValue([]);

    await api.list();
    await api.list({ sort: 'fertilizing' });
    await api.list({ categories: [''] });
    await api.list({
      categories: ['', 'Пальмы'],
      sort: 'watering',
    });

    expect(fetchJson.mock.calls.map((call) => call[0])).toEqual([
      '/api/plants',
      '/api/plants?sort=fertilizing',
      '/api/plants',
      `/api/plants?${new URLSearchParams([
        ['sort', 'watering'],
        ['category', 'Пальмы'],
      ]).toString()}`,
    ]);
  });

  it('ходит в карточку, полив, подкормку и обновление', async () => {
    const { api, fetchJson } = createApi();
    const plant = createPlant();

    fetchJson.mockResolvedValue(plant);

    await expect(api.get('plant-1')).resolves.toBe(plant);
    await expect(api.water('plant-1')).resolves.toBe(plant);
    await expect(api.fertilize('plant-1')).resolves.toBe(plant);
    await expect(api.update('plant-1', payload)).resolves.toBe(plant);

    expect(fetchJson.mock.calls[0]?.[0]).toBe('/api/plants/plant-1');
    expect(fetchJson.mock.calls[1]).toEqual([
      '/api/plants/plant-1/water',
      { method: 'PATCH' },
    ]);
    expect(fetchJson.mock.calls[2]).toEqual([
      '/api/plants/plant-1/fertilize',
      { method: 'PATCH' },
    ]);
    expect(fetchJson.mock.calls[3]?.[0]).toBe('/api/plants/plant-1');
    expect(fetchJson.mock.calls[3]?.[1]).toEqual({
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
  });

  it('добавляет, удаляет и назначает фото', async () => {
    const { api, fetchJson, request } = createApi();
    const plant = createPlant();
    const files = [imageFile('a.jpg'), imageFile('b.png', 'image/png')];

    fetchJson.mockResolvedValue(plant);
    request.mockResolvedValue(new Response(null, { status: 204 }));

    await api.addImages('plant-1', files);
    await api.deleteImage('plant-1', 'img-2');
    await api.setDefaultImage('plant-1', null);
    await api.setDefaultImage('plant-1', 'img-1');
    await api.assessConditionById('plant-1');
    await api.assessConditionByImageId('plant-1', 'img-2');
    await api.delete('plant-1');

    const added = fetchJson.mock.calls[0]?.[1].body as FormData;

    expect(fetchJson.mock.calls[0]?.[0]).toBe('/api/plants/plant-1/images');
    expect(added.getAll('images')).toEqual(files);
    expect(fetchJson.mock.calls[1]?.[0]).toBe(
      '/api/plants/plant-1/images/img-2',
    );
    expect(fetchJson.mock.calls[1]?.[1].method).toBe('DELETE');
    expect(fetchJson.mock.calls[2]?.[1].body).toBe(
      JSON.stringify({ imageId: null }),
    );
    expect(fetchJson.mock.calls[3]?.[1].body).toBe(
      JSON.stringify({ imageId: 'img-1' }),
    );
    expect(fetchJson.mock.calls[4]?.[0]).toBe(
      '/api/plants/plant-1/assess-condition',
    );
    expect(fetchJson.mock.calls[5]?.[0]).toBe(
      '/api/plants/plant-1/images/img-2/assess-condition',
    );
    expect(request).toHaveBeenCalledWith('/api/plants/plant-1', {
      method: 'DELETE',
    });
  });
});
