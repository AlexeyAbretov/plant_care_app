export type PlantSort = 'watering' | 'fertilizing';

export type PlantLocationKind = 'indoor' | 'outdoor';

export interface ListPlantsParams {
  sort?: PlantSort;
  categories?: string[];
}

export interface PlantImage {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  isDefault: boolean;
  isCover: boolean;
}

export interface Plant {
  id: string;
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  locationKind: PlantLocationKind;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: string;
  lastFertilizedAt: string;
  images: PlantImage[];
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type PlantHealthLevel = 'good' | 'fair' | 'poor';

export interface PlantConditionResult {
  assessment: string;
  healthLevel: PlantHealthLevel;
  recommendations: string[];
}

export interface PlantRecognizeResult {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
}

export interface CreatePlantPayload {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  locationKind: PlantLocationKind;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: string;
  lastFertilizedAt: string;
}

export type UpdatePlantPayload = CreatePlantPayload;
