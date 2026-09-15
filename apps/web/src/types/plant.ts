export interface Plant {
  id: string;
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: string;
  lastFertilizedAt: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
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
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: string;
  lastFertilizedAt: string;
}
