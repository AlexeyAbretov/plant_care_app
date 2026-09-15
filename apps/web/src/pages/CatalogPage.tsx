import {
  Button,
  Card,
  Empty,
  List,
  message,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, getApiUrl } from '../api/client.js';
import { deletePlant, listPlants } from '../api/plants.js';
import { DeletePlantButton } from '../components/plant/DeletePlantButton.js';
import type { Plant } from '../types/plant.js';

export function CatalogPage(): React.JSX.Element {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPlants(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      setPlants(await listPlants());
    } catch (loadError: unknown) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : 'Не удалось загрузить каталог',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlants();
  }, []);

  async function handleDelete(plantId: string): Promise<void> {
    await deletePlant(plantId);
    message.success('Растение удалено');
    await loadPlants();
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Каталог
      </Typography.Title>

      <Spin spinning={loading}>
        {error !== null ? (
          <Typography.Text type="danger">{error}</Typography.Text>
        ) : null}

        {!loading && error === null && plants.length === 0 ? (
          <Empty description="Пока нет растений">
            <Link to="/add">
              <Button type="primary">Добавить растение</Button>
            </Link>
          </Empty>
        ) : null}

        {!loading && error === null && plants.length > 0 ? (
          <List
            dataSource={plants}
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
            renderItem={(plant) => (
              <List.Item>
                <Card
                  cover={
                    <img
                      alt={plant.name}
                      src={getApiUrl(plant.thumbnailUrl)}
                      style={{
                        height: 160,
                        objectFit: 'cover',
                        width: '100%',
                      }}
                    />
                  }
                  title={plant.name}
                >
                  <Space wrap>
                    <Link to={`/plants/${plant.id}/edit`}>
                      <Button type="primary">Редактировать</Button>
                    </Link>
                    <DeletePlantButton
                      onConfirm={() => handleDelete(plant.id)}
                      plantName={plant.name}
                    />
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        ) : null}
      </Spin>
    </Space>
  );
}
