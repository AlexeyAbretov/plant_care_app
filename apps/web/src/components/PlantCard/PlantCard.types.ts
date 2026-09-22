import type { Plant, PlantConditionResult, WateringClimate } from '@types';

export type PlantCardProps = {
  plant: Plant;
  imageSrc: string;
  previewSrc: string;
  wateringClimate: WateringClimate | null;
  onWater: (id: string) => Promise<void>;
  onFertilize: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssess: (id: string) => Promise<PlantConditionResult>;
};
