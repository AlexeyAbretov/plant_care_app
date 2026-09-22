import type { PlantConditionResult } from '@types';

export type PlantGalleryImage = {
  id: string;
  src: string;
  previewSrc: string;
  isDefault: boolean;
  isCover: boolean;
};

export type PlantImageGalleryProps = {
  images: PlantGalleryImage[];
  disabled?: boolean;
  onAddFiles: (files: File[]) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onSetDefault: (imageId: string | null) => Promise<void>;
  onAssess: (imageId: string) => Promise<PlantConditionResult>;
};
