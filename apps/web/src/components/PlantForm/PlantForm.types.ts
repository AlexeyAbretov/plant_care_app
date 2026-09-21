import type { Dayjs } from 'dayjs';

import type { PlantLocationKind } from '@types';

export type PlantFormValues = {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  locationKind: PlantLocationKind;
  wateringIntervalDays?: number;
  fertilizingIntervalDays?: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: Dayjs;
  lastFertilizedAt: Dayjs;
};

export type PlantFormProps = {
  disabled?: boolean;
};
