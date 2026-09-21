import type { Dayjs } from 'dayjs';

export type PlantFormValues = {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
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
