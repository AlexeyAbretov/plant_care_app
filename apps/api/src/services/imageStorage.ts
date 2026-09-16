import type { Readable } from 'node:stream';

import type { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const BUCKET_NAME = 'plant_images';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export type ImageFileType = 'original' | 'thumbnail';

function getBucket(): GridFSBucket {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB не подключена');
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: ImageMimeType,
  plantId: string,
  type: ImageFileType,
): Promise<ObjectId> {
  const bucket = getBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { plantId, type },
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });
    uploadStream.end(buffer);
  });
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function getImageBuffer(
  fileId: ObjectId,
): Promise<{ buffer: Buffer; contentType: string }> {
  const { stream, contentType } = await getImageStream(fileId);
  const buffer = await streamToBuffer(stream);

  return { buffer, contentType };
}

export async function getImageStream(
  fileId: ObjectId,
): Promise<{ stream: Readable; contentType: string }> {
  const bucket = getBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  const file = files[0];

  if (!file) {
    throw new ImageNotFoundError();
  }

  const contentType =
    typeof file.contentType === 'string' ? file.contentType : 'image/jpeg';

  return {
    stream: bucket.openDownloadStream(fileId),
    contentType,
  };
}

export async function deleteImage(fileId: ObjectId): Promise<void> {
  const bucket = getBucket();

  try {
    await bucket.delete(fileId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes('File not found')) {
      throw error;
    }
  }
}

export async function deletePlantFiles(
  imageFileId: ObjectId,
  thumbnailFileId: ObjectId,
): Promise<void> {
  await Promise.all([deleteImage(imageFileId), deleteImage(thumbnailFileId)]);
}

export class ImageNotFoundError extends Error {
  constructor() {
    super('Изображение не найдено');
    this.name = 'ImageNotFoundError';
  }
}
