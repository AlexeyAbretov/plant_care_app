import type { Plant, WateringClimate } from '@types';

export type PlantCardProps = {
  plant: Plant;
  wateringClimate: WateringClimate | null;
  onWater: (id: string) => Promise<void>;
  onFertilize: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};
