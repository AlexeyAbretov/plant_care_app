import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import {
  ApiError,
  deletePlant as deletePlantApi,
  fertilizePlant,
  listPlants,
  waterPlant,
} from '../api';
import type { Plant, PlantSort } from '../types';

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
  const [categories, setCategories] = useState<string[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlants = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const hasCategoryFilter = categories.length > 0;
      const [filteredPlants, allPlants] = await Promise.all([
        listPlants({
          sort,
          categories: hasCategoryFilter ? categories : undefined,
        }),
        hasCategoryFilter ? listPlants({ sort }) : Promise.resolve(null),
      ]);

      setPlants(filteredPlants);

      const categorySource = allPlants ?? filteredPlants;

      setCategoryOptions(collectCategories(categorySource));
    } catch (loadError: unknown) {
      const errorMessage =
        loadError instanceof ApiError
          ? loadError.message
          : 'Не удалось загрузить каталог';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categories, sort]);

  useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  const refreshPlants = useCallback(async (): Promise<void> => {
    const nextPlants = await listPlants({
      sort,
      categories: categories.length > 0 ? categories : undefined,
    });

    setPlants(nextPlants);
  }, [categories, sort]);

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
    categories,
    setCategories,
    plants,
    categoryOptions,
    loading,
    error,
    reload: loadPlants,
    waterPlant: handleWater,
    fertilizePlant: handleFertilize,
    deletePlant: handleDelete,
  };
}
