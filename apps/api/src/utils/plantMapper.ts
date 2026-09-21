import type { PlantDocument } from '../models/Plant.js';
import type { PlantDto } from '../types/plant.js';

export function toPlantDto(plant: PlantDocument): PlantDto {
  const id = plant._id.toString();

  return {
    id,
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
    lastWateredAt: plant.lastWateredAt.toISOString(),
    lastFertilizedAt: plant.lastFertilizedAt.toISOString(),
    imageUrl: `/api/plants/${id}/image`,
    thumbnailUrl: `/api/plants/${id}/thumbnail`,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
  };
}
