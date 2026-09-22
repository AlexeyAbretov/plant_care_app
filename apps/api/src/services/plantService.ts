import type { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

import {
  deletePlantFiles,
  getImageBuffer,
  getImageStream,
  type ImageMimeType,
  ImageNotFoundError,
  uploadImage,
} from './imageStorage.js';
import { generateThumbnail } from './thumbnail.js';

import {
  type PlantDocument,
  type PlantImage,
  PlantModel,
} from '../models/Plant.js';
import type { PlantFields, PlantSort } from '../types/plant.js';
import { MAX_PLANT_IMAGES, resolveCoverImage } from '../utils/plantImages.js';
import { toPlantDto } from '../utils/plantMapper.js';

export class PlantNotFoundError extends Error {
  constructor() {
    super('Растение не найдено');
    this.name = 'PlantNotFoundError';
  }
}

export class LastPlantImageError extends Error {
  constructor() {
    super('Нельзя удалить единственное изображение');
    this.name = 'LastPlantImageError';
  }
}

export class TooManyPlantImagesError extends Error {
  constructor() {
    super(`Можно загрузить не больше ${MAX_PLANT_IMAGES} изображений`);
    this.name = 'TooManyPlantImagesError';
  }
}

interface ImageUploadInput {
  buffer: Buffer;
  mimetype: ImageMimeType;
  originalname: string;
}

interface StoredPlantImage {
  imageId: mongoose.Types.ObjectId;
  imageFileId: ObjectId;
  thumbnailFileId: ObjectId;
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

function ensureImages(plant: PlantDocument): void {
  if (plant.images.length > 0) {
    return;
  }

  plant.images.push({
    imageFileId: plant.imageFileId,
    thumbnailFileId: plant.thumbnailFileId,
    createdAt: plant.createdAt,
  });
}

function syncCover(plant: PlantDocument): void {
  const cover = resolveCoverImage(plant.images, plant.defaultImageId);

  if (!cover) {
    return;
  }

  if (plant.imageFileId.toString() !== cover.imageFileId.toString()) {
    plant.imageFileId = cover.imageFileId;
  }

  if (plant.thumbnailFileId.toString() !== cover.thumbnailFileId.toString()) {
    plant.thumbnailFileId = cover.thumbnailFileId;
  }
}

async function loadPlant(id: string): Promise<PlantDocument> {
  const plant = await PlantModel.findById(id);

  if (!plant) {
    throw new PlantNotFoundError();
  }

  ensureImages(plant);
  syncCover(plant);

  if (plant.isModified()) {
    await plant.save();
  }

  return plant;
}

async function migrateLegacyPlantImages(): Promise<void> {
  const plants = await PlantModel.find({
    $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
  });

  for (const plant of plants) {
    ensureImages(plant);
    syncCover(plant);
    await plant.save();
  }
}

async function storePlantImage(
  plantId: string,
  image: ImageUploadInput,
): Promise<StoredPlantImage> {
  const imageId = new mongoose.Types.ObjectId();
  const thumbnailBuffer = await generateThumbnail(image.buffer);
  const ext = image.originalname.split('.').pop() ?? 'jpg';
  const suffix = imageId.toString();

  const [imageFileId, thumbnailFileId] = await Promise.all([
    uploadImage(
      image.buffer,
      `${plantId}-${suffix}-original.${ext}`,
      image.mimetype,
      plantId,
      'original',
    ),
    uploadImage(
      thumbnailBuffer,
      `${plantId}-${suffix}-thumbnail.webp`,
      'image/webp',
      plantId,
      'thumbnail',
    ),
  ]);

  return { imageId, imageFileId, thumbnailFileId };
}

function pushStoredImage(plant: PlantDocument, stored: StoredPlantImage): void {
  plant.images.push({
    _id: stored.imageId,
    imageFileId: stored.imageFileId,
    thumbnailFileId: stored.thumbnailFileId,
    createdAt: new Date(),
  });
}

function findPlantImage(
  plant: PlantDocument,
  imageId: string,
): PlantImage | null {
  return plant.images.id(imageId);
}

export async function createPlant(
  fields: PlantFields,
  image: ImageUploadInput,
) {
  const plantId = new mongoose.Types.ObjectId();
  const stored = await storePlantImage(plantId.toString(), image);

  const plant = await PlantModel.create({
    _id: plantId,
    ...fields,
    images: [
      {
        _id: stored.imageId,
        imageFileId: stored.imageFileId,
        thumbnailFileId: stored.thumbnailFileId,
        createdAt: new Date(),
      },
    ],
    defaultImageId: null,
    imageFileId: stored.imageFileId,
    thumbnailFileId: stored.thumbnailFileId,
  });

  return toPlantDto(plant);
}

export async function addPlantImages(id: string, images: ImageUploadInput[]) {
  const plant = await loadPlant(id);

  if (plant.images.length + images.length > MAX_PLANT_IMAGES) {
    throw new TooManyPlantImagesError();
  }

  for (const image of images) {
    const stored = await storePlantImage(id, image);

    pushStoredImage(plant, stored);
  }

  syncCover(plant);
  await plant.save();

  return toPlantDto(plant);
}

export async function deletePlantImage(id: string, imageId: string) {
  const plant = await loadPlant(id);

  if (plant.images.length <= 1) {
    throw new LastPlantImageError();
  }

  const image = findPlantImage(plant, imageId);

  if (!image) {
    throw new ImageNotFoundError();
  }

  const imageFileId = image.imageFileId;
  const thumbnailFileId = image.thumbnailFileId;

  plant.images.pull(image._id);

  if (plant.defaultImageId?.toString() === imageId) {
    plant.defaultImageId = null;
  }

  syncCover(plant);
  await plant.save();
  await deletePlantFiles(imageFileId, thumbnailFileId);

  return toPlantDto(plant);
}

export async function setPlantDefaultImage(id: string, imageId: string | null) {
  const plant = await loadPlant(id);

  if (imageId === null) {
    plant.defaultImageId = null;
  } else {
    const image = findPlantImage(plant, imageId);

    if (!image) {
      throw new ImageNotFoundError();
    }

    plant.defaultImageId = image._id;
  }

  syncCover(plant);
  await plant.save();

  return toPlantDto(plant);
}

export async function listPlants(options: {
  sort: PlantSort;
  categories?: string[];
}) {
  await migrateLegacyPlantImages();

  const filter =
    options.categories !== undefined && options.categories.length > 0
      ? { category: { $in: options.categories } }
      : {};
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
  const plant = await loadPlant(id);

  return toPlantDto(plant);
}

export async function updatePlant(id: string, fields: Partial<PlantFields>) {
  const plant = await loadPlant(id);

  Object.assign(plant, fields);
  await plant.save();

  return toPlantDto(plant);
}

export async function waterPlant(id: string) {
  const plant = await loadPlant(id);

  plant.lastWateredAt = new Date();
  await plant.save();

  return toPlantDto(plant);
}

export async function fertilizePlant(id: string) {
  const plant = await loadPlant(id);

  plant.lastFertilizedAt = new Date();
  await plant.save();

  return toPlantDto(plant);
}

export async function deletePlant(id: string) {
  const plant = await loadPlant(id);
  const files = plant.images.map((image) => {
    return {
      imageFileId: image.imageFileId,
      thumbnailFileId: image.thumbnailFileId,
    };
  });

  await Promise.all(
    files.map((file) => {
      return deletePlantFiles(file.imageFileId, file.thumbnailFileId);
    }),
  );
  await PlantModel.findByIdAndDelete(id);
}

export async function getPlantImage(
  id: string,
  type: 'original' | 'thumbnail',
  imageId?: string,
) {
  const plant = await loadPlant(id);
  const image =
    imageId === undefined
      ? resolveCoverImage(plant.images, plant.defaultImageId)
      : findPlantImage(plant, imageId);

  if (!image) {
    throw new ImageNotFoundError();
  }

  const fileId =
    type === 'original' ? image.imageFileId : image.thumbnailFileId;

  try {
    return await getImageStream(fileId);
  } catch (error) {
    if (error instanceof ImageNotFoundError && imageId === undefined) {
      throw new PlantNotFoundError();
    }

    throw error;
  }
}

export async function readPlantImageBuffer(id: string, imageId?: string) {
  const plant = await loadPlant(id);
  const image =
    imageId === undefined
      ? resolveCoverImage(plant.images, plant.defaultImageId)
      : findPlantImage(plant, imageId);

  if (!image) {
    throw new ImageNotFoundError();
  }

  try {
    return await getImageBuffer(image.imageFileId);
  } catch (error) {
    if (error instanceof ImageNotFoundError && imageId === undefined) {
      throw new PlantNotFoundError();
    }

    throw error;
  }
}
