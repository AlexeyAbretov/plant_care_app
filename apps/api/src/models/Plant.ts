import mongoose, { type Document, Schema, type Types } from 'mongoose';

import type { PlantLocationKind } from '../types/plant.js';

export interface PlantDocument extends Document {
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
  lastWateredAt: Date;
  lastFertilizedAt: Date;
  imageFileId: Types.ObjectId;
  thumbnailFileId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const plantSchema = new Schema<PlantDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    lightPreference: { type: String, default: '' },
    sizeInfo: { type: String, default: '' },
    locationKind: {
      type: String,
      enum: ['indoor', 'outdoor'],
      default: 'indoor',
    },
    wateringIntervalDays: { type: Number, required: true, min: 1 },
    fertilizingIntervalDays: { type: Number, required: true, min: 1 },
    wateringNotes: { type: String, default: '' },
    fertilizingNotes: { type: String, default: '' },
    lastWateredAt: { type: Date, required: true },
    lastFertilizedAt: { type: Date, required: true },
    imageFileId: { type: Schema.Types.ObjectId, required: true },
    thumbnailFileId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

export const PlantModel = mongoose.model<PlantDocument>('Plant', plantSchema);
