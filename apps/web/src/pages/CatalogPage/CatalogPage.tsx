import { Col, Empty, Row, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { CatalogToolbar, PlantCard, RetryAlert } from '@components';
import { usePlantsCatalog } from '@hooks';

export function CatalogPage(): React.JSX.Element {
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
        categories={categories}
        categoryOptions={categoryOptions}
        disabled={loading}
        onCategoriesChange={setCategories}
        onSortChange={setSort}
        sort={sort}
      />

      {error !== null ? (
        <RetryAlert
          message={error}
          onRetry={() => {
            void reload();
          }}
          showIcon
          style={{ marginTop: 16 }}
          type="error"
        />
      ) : null}

      {!loading && error === null && plants.length === 0 ? (
        <Empty description="Растений пока нет" style={{ marginTop: 48 }}>
          <Link to="/add">Добавить растение</Link>
        </Empty>
      ) : null}

      {!loading && error === null && plants.length > 0 ? (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {plants.map((plant) => (
            <Col key={plant.id} lg={6} md={8} sm={12} xs={24}>
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
    </Spin>
  );
}
