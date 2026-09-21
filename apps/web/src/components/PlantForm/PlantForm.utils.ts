import type { Rule } from 'antd/es/form';
import dayjs, { type Dayjs } from 'dayjs';

import type { CreatePlantPayload, Plant } from '@types';

import type { PlantFormValues } from './PlantForm.types';

export const plantFormRules: Record<string, Rule[]> = {
  name: [{ required: true, message: 'Укажите название растения' }],
  locationKind: [{ required: true, message: 'Укажите, где стоит растение' }],
  wateringIntervalDays: [
    { required: true, message: 'Укажите интервал полива' },
    { type: 'number', min: 1, message: 'Интервал полива — не менее 1 дня' },
  ],
  fertilizingIntervalDays: [
    { required: true, message: 'Укажите интервал подкормки' },
    {
      type: 'number',
      min: 1,
      message: 'Интервал подкормки — не менее 1 дня',
    },
  ],
  lastWateredAt: [{ required: true, message: 'Укажите дату полива' }],
  lastFertilizedAt: [{ required: true, message: 'Укажите дату подкормки' }],
};

const formatDateForApi = (value: Dayjs): string => {
  return value.startOf('day').format('YYYY-MM-DD');
};

export const mapFormValuesToPayload = (
  values: PlantFormValues,
): CreatePlantPayload => {
  return {
    name: values.name.trim(),
    description: values.description ?? '',
    category: values.category ?? '',
    lightPreference: values.lightPreference ?? '',
    sizeInfo: values.sizeInfo ?? '',
    locationKind: values.locationKind,
    wateringIntervalDays: values.wateringIntervalDays!,
    fertilizingIntervalDays: values.fertilizingIntervalDays!,
    wateringNotes: values.wateringNotes ?? '',
    fertilizingNotes: values.fertilizingNotes ?? '',
    lastWateredAt: formatDateForApi(values.lastWateredAt),
    lastFertilizedAt: formatDateForApi(values.lastFertilizedAt),
  };
};

export const mapPlantToFormValues = (plant: Plant): PlantFormValues => {
  return {
    name: plant.name,
    description: plant.description,
    category: plant.category,
    lightPreference: plant.lightPreference,
    sizeInfo: plant.sizeInfo,
    locationKind: plant.locationKind ?? 'indoor',
    wateringIntervalDays: plant.wateringIntervalDays,
    fertilizingIntervalDays: plant.fertilizingIntervalDays,
    wateringNotes: plant.wateringNotes,
    fertilizingNotes: plant.fertilizingNotes,
    lastWateredAt: dayjs(plant.lastWateredAt).startOf('day'),
    lastFertilizedAt: dayjs(plant.lastFertilizedAt).startOf('day'),
  };
};
