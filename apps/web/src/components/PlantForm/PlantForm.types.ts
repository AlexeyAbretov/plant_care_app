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
  onRecognize?: () => void;
  recognizeLoading?: boolean;
};

export type NameWithRecognizeProps = {
  disabled?: boolean;
  id?: string;
  onChange?: (value: string) => void;
  onRecognize: () => void;
  recognizeLoading?: boolean;
  value?: string;
};

export type PlantDateFieldProps = {
  disabled?: boolean;
  id?: string;
  onChange?: (value: string) => void;
  value?: string;
};
