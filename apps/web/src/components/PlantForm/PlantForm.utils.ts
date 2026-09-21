import dayjs, { type Dayjs } from 'dayjs';

import type { CreatePlantPayload, Plant } from '@types';

import type { PlantFormValues } from './PlantForm';

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
    wateringIntervalDays: plant.wateringIntervalDays,
    fertilizingIntervalDays: plant.fertilizingIntervalDays,
    wateringNotes: plant.wateringNotes,
    fertilizingNotes: plant.fertilizingNotes,
    lastWateredAt: dayjs(plant.lastWateredAt).startOf('day'),
    lastFertilizedAt: dayjs(plant.lastFertilizedAt).startOf('day'),
  };
};
