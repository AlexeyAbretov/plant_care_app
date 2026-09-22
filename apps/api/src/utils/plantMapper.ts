import { resolveCoverImage, sortPlantImages } from './plantImages.js';

import type { PlantDocument, PlantImage } from '../models/Plant.js';
import type { PlantDto, PlantImageDto } from '../types/plant.js';

function toImageSources(plant: PlantDocument): PlantImage[] {
  const stored = plant.images ?? [];

  if (stored.length > 0) {
    return sortPlantImages(stored);
  }

  return [
    {
      _id: plant.imageFileId,
      imageFileId: plant.imageFileId,
      thumbnailFileId: plant.thumbnailFileId,
      createdAt: plant.createdAt,
    },
  ];
}

export function toPlantDto(plant: PlantDocument): PlantDto {
  const id = plant._id.toString();
  const images = toImageSources(plant);
  const cover = resolveCoverImage(images, plant.defaultImageId);
  const coverId = cover?._id.toString() ?? '';
  const defaultId = plant.defaultImageId?.toString() ?? null;
  const imageDtos: PlantImageDto[] = images.map((image) => {
    const imageId = image._id.toString();

    return {
      id: imageId,
      imageUrl: `/api/plants/${id}/images/${imageId}`,
      thumbnailUrl: `/api/plants/${id}/images/${imageId}/thumbnail`,
      createdAt: new Date(image.createdAt).toISOString(),
      isDefault: imageId === defaultId,
      isCover: imageId === coverId,
    };
  });

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
    images: imageDtos,
    imageUrl: `/api/plants/${id}/image`,
    thumbnailUrl: `/api/plants/${id}/thumbnail`,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
  };
}
