import { message } from 'antd';

import type {
  Plant,
  PlantConditionResult,
  PlantImage,
  PlantRecognizeResult,
  WeatherSnapshot,
} from '@types';

export const quietMessage = (): ReturnType<typeof message.error> => {
  return (() => {}) as ReturnType<typeof message.error>;
};

export const plantImage = (id = 'img-1'): PlantImage => {
  return {
    createdAt: '2026-09-01T00:00:00.000Z',
    id,
    imageUrl: `/files/${id}`,
    isCover: true,
    isDefault: true,
    thumbnailUrl: `/files/${id}/thumb`,
  };
};

export const createPlant = (overrides: Partial<Plant> = {}): Plant => {
  return {
    category: 'Декоративные',
    createdAt: '2026-09-01T00:00:00.000Z',
    description: 'Крупные листья',
    fertilizingIntervalDays: 30,
    fertilizingNotes: 'Весной',
    id: 'plant-1',
    imageUrl: '/files/img-1',
    images: [plantImage()],
    lastFertilizedAt: '2026-09-01',
    lastWateredAt: '2026-09-20',
    lightPreference: 'Рассеянный свет',
    locationKind: 'indoor',
    name: 'Монстера',
    sizeInfo: 'Средний',
    thumbnailUrl: '/files/img-1/thumb',
    updatedAt: '2026-09-20T00:00:00.000Z',
    wateringIntervalDays: 7,
    wateringNotes: 'Не заливать',
    ...overrides,
  };
};

export const weatherSnapshot = (
  overrides: Partial<WeatherSnapshot> = {},
): WeatherSnapshot => {
  return {
    current: {
      condition: 'Переменная облачность',
      kind: 'partlyCloudy',
      temperatureC: 18.4,
      weatherCode: 2,
    },
    daily: [
      {
        condition: 'Переменная облачность',
        date: '2026-09-22',
        kind: 'partlyCloudy',
        precipitationProbability: 10,
        tempMaxC: 19,
        tempMinC: -2,
        weatherCode: 2,
      },
    ],
    latitude: 55.75,
    locationLabel: 'Москва',
    longitude: 37.62,
    wateringClimate: {
      heat: false,
      heatingSeason: false,
      overcast: false,
      precipitationLikely: false,
    },
    ...overrides,
  };
};

export const conditionResult = (
  overrides: Partial<PlantConditionResult> = {},
): PlantConditionResult => {
  return {
    assessment: 'Листья упругие',
    healthLevel: 'good',
    recommendations: ['Полить утром', 'Не переставлять'],
    ...overrides,
  };
};

export const recognizeResult = (): PlantRecognizeResult => {
  return {
    category: 'Декоративные',
    description: 'Комнатное дерево',
    fertilizingIntervalDays: 14,
    fertilizingNotes: 'Раз в две недели',
    lightPreference: 'Яркий свет',
    name: 'Фикус',
    sizeInfo: 'Крупный',
    wateringIntervalDays: 7,
    wateringNotes: 'После просыхания',
  };
};

export const imageFile = (
  name = 'plant.jpg',
  type = 'image/jpeg',
  byteLength = 32,
): File => {
  return new File([new Uint8Array(byteLength)], name, { type });
};

export const deferred = <T>(): {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
} => {
  let rejectPromise: (reason?: unknown) => void = () => {};

  let resolvePromise: (value: T) => void = () => {};

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    reject: rejectPromise,
    resolve: resolvePromise,
  };
};
