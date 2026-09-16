import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../api/client.js';
import {
  deletePlant as deletePlantApi,
  fertilizePlant,
  listPlants,
  waterPlant,
} from '../api/plants.js';
import type { Plant, PlantSort } from '../types/plant.js';

function collectCategories(plants: Plant[]): string[] {
  const categories = new Set<string>();

  for (const plant of plants) {
    if (plant.category !== '') {
      categories.add(plant.category);
    }
  }

  return [...categories].sort((left, right) => left.localeCompare(right, 'ru'));
}

function replacePlantInPlace(plants: Plant[], updatedPlant: Plant): Plant[] {
  const index = plants.findIndex((plant) => plant.id === updatedPlant.id);

  if (index === -1) {
    return plants;
  }

  const nextPlants = [...plants];

  nextPlants[index] = updatedPlant;

  return nextPlants;
}

export function usePlantsCatalog() {
  const [sort, setSort] = useState<PlantSort>('watering');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlants = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [filteredPlants, allPlants] = await Promise.all([
        listPlants({ sort, category }),
        category === undefined ? Promise.resolve(null) : listPlants({ sort }),
      ]);

      setPlants(filteredPlants);

      const categorySource = allPlants ?? filteredPlants;

      setCategories(collectCategories(categorySource));
    } catch (loadError: unknown) {
      const errorMessage =
        loadError instanceof ApiError
          ? loadError.message
          : 'Не удалось загрузить каталог';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  const refreshPlants = useCallback(async (): Promise<void> => {
    const nextPlants = await listPlants({ sort, category });

    setPlants(nextPlants);
  }, [category, sort]);

  const handleWater = useCallback(async (id: string): Promise<void> => {
    try {
      const updatedPlant = await waterPlant(id);

      setPlants((currentPlants) =>
        replacePlantInPlace(currentPlants, updatedPlant),
      );
      message.success('Полив отмечен');
    } catch (actionError: unknown) {
      const errorMessage =
        actionError instanceof ApiError
          ? actionError.message
          : 'Не удалось отметить полив';

      message.error(errorMessage);
    }
  }, []);

  const handleFertilize = useCallback(async (id: string): Promise<void> => {
    try {
      const updatedPlant = await fertilizePlant(id);

      setPlants((currentPlants) =>
        replacePlantInPlace(currentPlants, updatedPlant),
      );
      message.success('Подкормка отмечена');
    } catch (actionError: unknown) {
      const errorMessage =
        actionError instanceof ApiError
          ? actionError.message
          : 'Не удалось отметить подкормку';

      message.error(errorMessage);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deletePlantApi(id);
        await refreshPlants();
        message.success('Растение удалено');
      } catch (actionError: unknown) {
        const errorMessage =
          actionError instanceof ApiError
            ? actionError.message
            : 'Не удалось удалить растение';

        message.error(errorMessage);
      }
    },
    [refreshPlants],
  );

  return {
    sort,
    setSort,
    category,
    setCategory,
    plants,
    categories,
    loading,
    error,
    reload: loadPlants,
    waterPlant: handleWater,
    fertilizePlant: handleFertilize,
    deletePlant: handleDelete,
  };
}
