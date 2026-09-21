import { Col, Empty, Flex, Grid, Row, Spin, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  CatalogToolbar,
  CategoryCloudDrawer,
  PlantCard,
  RetryAlert,
} from '@components';
import { usePlantsCatalog } from '@hooks';

const { useBreakpoint } = Grid;

const readInitialCategoriesDrawerOpen = (): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.matchMedia('(min-width: 768px)').matches;
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
  } = usePlantsCatalog();

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

          {!loading && error === null && plants.length > 0 ? (
            <Row gutter={[16, 16]}>
              {plants.map((plant) => (
                <Col
                  key={plant.id}
                  lg={6}
                  md={8}
                  sm={12}
                  style={{ minWidth: 0 }}
                  xs={24}
                >
                  <PlantCard
                    onDelete={deletePlant}
                    onFertilize={fertilizePlant}
                    onWater={waterPlant}
                    plant={plant}
                  />
                </Col>
              ))}
            </Row>
          ) : null}
        </div>
      </Flex>
    </Spin>
  );
};
