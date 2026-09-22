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
  lastWateredAt: string;
  lastFertilizedAt: string;
};

export type PlantFormProps = {
  disabled?: boolean;
};

export type PlantDateFieldProps = {
  disabled?: boolean;
  id?: string;
  onChange?: (value: string) => void;
  value?: string;
};
