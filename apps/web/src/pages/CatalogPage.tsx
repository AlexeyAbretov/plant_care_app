import { Alert, Button, Col, Empty, Row, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { CatalogToolbar } from '../components/catalog/CatalogToolbar.js';
import { PlantCard } from '../components/catalog/PlantCard.js';
import { usePlantsCatalog } from '../hooks/usePlantsCatalog.js';

export function CatalogPage(): React.JSX.Element {
  const {
    sort,
    setSort,
    category,
    setCategory,
    plants,
    categories,
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
        category={category}
        disabled={loading}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        sort={sort}
      />

      {error !== null ? (
        <Alert
          action={
            <Button
              onClick={() => {
                void reload();
              }}
              size="small"
            >
              Повторить
            </Button>
          }
          message={error}
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
