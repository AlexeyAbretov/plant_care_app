import { createPlant } from '@test/fixtures';
import { describe, expect, it } from 'vitest';

import type { PlantFormValues } from '../PlantForm.types';
import {
  mapFormValuesToPayload,
  mapPlantToFormValues,
} from '../PlantForm.utils';

describe('PlantForm.utils', () => {
  it('обрезает название и подставляет пустые необязательные поля', () => {
    const values = {
      fertilizingIntervalDays: 14,
      lastFertilizedAt: '2026-09-22T15:00:00',
      lastWateredAt: '2026-09-21',
      locationKind: 'outdoor',
      name: '  Фикус  ',
      wateringIntervalDays: 3,
    } as PlantFormValues;

    expect(mapFormValuesToPayload(values)).toEqual({
      category: '',
      description: '',
      fertilizingIntervalDays: 14,
      fertilizingNotes: '',
      lastFertilizedAt: '2026-09-22',
      lastWateredAt: '2026-09-21',
      lightPreference: '',
      locationKind: 'outdoor',
      name: 'Фикус',
      sizeInfo: '',
      wateringIntervalDays: 3,
      wateringNotes: '',
    });
  });

  it('переносит растение в значения формы', () => {
    const plant = createPlant({ locationKind: undefined });

    expect(mapPlantToFormValues(plant)).toMatchObject({
      lastFertilizedAt: '2026-09-01',
      lastWateredAt: '2026-09-20',
      locationKind: 'indoor',
      name: 'Монстера',
    });
  });
});
