import type { Request } from 'express';
import mongoose from 'mongoose';

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];

  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function parseObjectId(id: string): mongoose.Types.ObjectId | null {
  if (!isValidObjectId(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
}
