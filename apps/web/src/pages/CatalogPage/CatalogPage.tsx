import { Col, Empty, Flex, Grid, Row, Spin, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient } from '@api';
import {
  CatalogToolbar,
  CategoryCloudDrawer,
  comparePlantsByWateringDue,
  PlantCard,
  RetryAlert,
} from '@components';
import { usePlantsCatalog, useWeather } from '@hooks';
import type { Plant } from '@types';

const { useBreakpoint } = Grid;

const readInitialCategoriesDrawerOpen = (): boolean => {
  return window.matchMedia('(min-width: 768px)').matches;
};

const getTileImages = (
  plant: Plant,
): { imageSrc: string; previewIndex: number; previewSrcs: string[] } => {
  const previewSrcs =
    plant.images.length > 0
      ? plant.images.map((image) => apiClient.url(image.imageUrl))
      : [apiClient.url(plant.imageUrl)];
  const coverIndex = plant.images.findIndex((image) => image.isCover);

  return {
    imageSrc: apiClient.url(plant.thumbnailUrl),
    previewIndex: coverIndex < 0 ? 0 : coverIndex,
    previewSrcs,
  };
};

export const CatalogPage = (): React.JSX.Element => {
  const screens = useBreakpoint();
  const isWide = Boolean(screens.md);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(
    readInitialCategoriesDrawerOpen,
  );

  const {
    sort,
    setSort,
    categories,
    setCategories,
    plants,
    categoryOptions,
    loading,
    error,
    reload,
    waterPlant,
    fertilizePlant,
    deletePlant,
    assessPlant,
  } = usePlantsCatalog();

  const { weather } = useWeather();
  const wateringClimate = weather?.wateringClimate ?? null;
  const catalogPlants = useMemo(() => {
    if (sort !== 'watering') {
      return plants;
    }

    return [...plants].sort((left, right) => {
      return comparePlantsByWateringDue(left, right, wateringClimate);
    });
  }, [plants, sort, wateringClimate]);

  return (
    <Spin spinning={loading}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Каталог
      </Typography.Title>

      <CatalogToolbar
        categoriesDrawerOpen={categoriesDrawerOpen}
        disabled={loading}
        onCategoriesDrawerOpenChange={setCategoriesDrawerOpen}
        onSortChange={setSort}
        sort={sort}
      />

      <Flex align="flex-start" gap={16} style={{ marginTop: 16 }}>
        <CategoryCloudDrawer
          categories={categories}
          categoryOptions={categoryOptions}
          disabled={loading}
          embedded={isWide}
          onCategoriesChange={setCategories}
          onOpenChange={setCategoriesDrawerOpen}
          open={categoriesDrawerOpen}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {error !== null ? (
            <RetryAlert
              message={error}
              onRetry={() => {
                void reload();
              }}
              showIcon
              type="error"
            />
          ) : null}

          {!loading && error === null && plants.length === 0 ? (
            <Empty description="Растений пока нет" style={{ marginTop: 48 }}>
              <Link to="/add">Добавить растение</Link>
            </Empty>
          ) : null}

          {!loading && error === null && catalogPlants.length > 0 ? (
            <Row gutter={[16, 16]}>
              {catalogPlants.map((plant) => {
                const tileImages = getTileImages(plant);

                return (
                  <Col
                    key={plant.id}
                    lg={6}
                    md={8}
                    sm={12}
                    style={{ minWidth: 0 }}
                    xs={24}
                  >
                    <PlantCard
                      imageSrc={tileImages.imageSrc}
                      onAssess={assessPlant}
                      onDelete={deletePlant}
                      onFertilize={fertilizePlant}
                      onWater={waterPlant}
                      plant={plant}
                      previewIndex={tileImages.previewIndex}
                      previewSrcs={tileImages.previewSrcs}
                      wateringClimate={wateringClimate}
                    />
                  </Col>
                );
              })}
            </Row>
          ) : null}
        </div>
      </Flex>
    </Spin>
  );
};
