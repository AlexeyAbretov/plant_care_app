import type { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

import {
  deletePlantFiles,
  getImageStream,
  type ImageMimeType,
  ImageNotFoundError,
  uploadImage,
} from './imageStorage.js';
import { generateThumbnail } from './thumbnail.js';

import { type PlantDocument, PlantModel } from '../models/Plant.js';
import type { PlantFields, PlantSort } from '../types/plant.js';
import { toPlantDto } from '../utils/plantMapper.js';

export class PlantNotFoundError extends Error {
  constructor() {
    super('Растение не найдено');
    this.name = 'PlantNotFoundError';
  }
}

interface ImageUploadInput {
  buffer: Buffer;
  mimetype: ImageMimeType;
  originalname: string;
}

function sortField(sort: PlantSort): 'lastWateredAt' | 'lastFertilizedAt' {
  if (sort === 'fertilizing') {
    return 'lastFertilizedAt';
  }

  return 'lastWateredAt';
}

function intervalField(
  sort: PlantSort,
): 'wateringIntervalDays' | 'fertilizingIntervalDays' {
  if (sort === 'fertilizing') {
    return 'fertilizingIntervalDays';
  }

  return 'wateringIntervalDays';
}

async function storePlantImages(
  plantId: string,
  image: ImageUploadInput,
): Promise<{ imageFileId: ObjectId; thumbnailFileId: ObjectId }> {
  const thumbnailBuffer = await generateThumbnail(image.buffer);
  const ext = image.originalname.split('.').pop() ?? 'jpg';

  const [imageFileId, thumbnailFileId] = await Promise.all([
    uploadImage(
      image.buffer,
      `${plantId}-original.${ext}`,
      image.mimetype,
      plantId,
      'original',
    ),
    uploadImage(
      thumbnailBuffer,
      `${plantId}-thumbnail.webp`,
      'image/webp',
      plantId,
      'thumbnail',
    ),
  ]);

  return { imageFileId, thumbnailFileId };
}

export async function createPlant(
  fields: PlantFields,
  image: ImageUploadInput,
) {
  const plantId = new mongoose.Types.ObjectId();
  const { imageFileId, thumbnailFileId } = await storePlantImages(
    plantId.toString(),
    image,
  );

  const plant = await PlantModel.create({
    _id: plantId,
    ...fields,
    imageFileId,
    thumbnailFileId,
  });

  return toPlantDto(plant);
}

export async function listPlants(options: {
  sort: PlantSort;
  category?: string;
}) {
  const filter = options.category ? { category: options.category } : {};
  const dateField = sortField(options.sort);
  const daysField = intervalField(options.sort);
  const msPerDay = 86_400_000;

  const plants = await PlantModel.aggregate<PlantDocument>([
    { $match: filter },
    {
      $addFields: {
        dueDate: {
          $add: [`$${dateField}`, { $multiply: [`$${daysField}`, msPerDay] }],
        },
      },
    },
    { $sort: { dueDate: 1 } },
  ]);

  return plants.map((plant) => toPlantDto(plant));
}

export async function getPlantById(id: string) {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  return toPlantDto(plant);
}

export async function updatePlant(
  id: string,
  fields: Partial<PlantFields>,
  image?: ImageUploadInput,
) {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  const oldImageFileId = plant.imageFileId;
  const oldThumbnailFileId = plant.thumbnailFileId;

  Object.assign(plant, fields);

  if (image) {
    const { imageFileId, thumbnailFileId } = await storePlantImages(id, image);

    plant.imageFileId = imageFileId;
    plant.thumbnailFileId = thumbnailFileId;
  }

  await plant.save();

  if (image) {
    await deletePlantFiles(oldImageFileId, oldThumbnailFileId);
  }

  return toPlantDto(plant);
}

export async function waterPlant(id: string) {
  const plant = await PlantModel.findByIdAndUpdate(
    id,
    { lastWateredAt: new Date() },
    { new: true },
  );

  if (!plant) {
    throw new PlantNotFoundError();
  }

  return toPlantDto(plant);
}

export async function fertilizePlant(id: string) {
  const plant = await PlantModel.findByIdAndUpdate(
    id,
    { lastFertilizedAt: new Date() },
    { new: true },
  );

  if (!plant) {
    throw new PlantNotFoundError();
  }

  return toPlantDto(plant);
}

export async function deletePlant(id: string) {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  await deletePlantFiles(plant.imageFileId, plant.thumbnailFileId);
  await PlantModel.findByIdAndDelete(id);
}

export async function getPlantImage(
  id: string,
  type: 'original' | 'thumbnail',
) {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  const fileId =
    type === 'original' ? plant.imageFileId : plant.thumbnailFileId;

  try {
    return await getImageStream(fileId);
  } catch (error) {
    if (error instanceof ImageNotFoundError) {
      throw new PlantNotFoundError();
    }

    throw error;
  }
}
