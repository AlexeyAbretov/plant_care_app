export interface PlantDto {
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

export interface PlantFields {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: Date;
  lastFertilizedAt: Date;
}

export type PlantSort = 'watering' | 'fertilizing';
