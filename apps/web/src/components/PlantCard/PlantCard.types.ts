import type { Plant } from '@types';

export type PlantCardProps = {
  plant: Plant;
  onWater: (id: string) => Promise<void>;
  onFertilize: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};
