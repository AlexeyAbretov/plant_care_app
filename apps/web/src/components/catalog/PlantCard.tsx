import { Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiUrl } from '../../api/client.js';
import { DeletePlantButton } from '../plant/DeletePlantButton.js';
import type { Plant } from '../../types/plant.js';
import { CareProgressBar } from './CareProgressBar.js';

type PlantCardProps = {
  plant: Plant;
  onWater: (id: string) => Promise<void>;
  onFertilize: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function PlantCard({
  plant,
  onWater,
  onFertilize,
  onDelete,
}: PlantCardProps): React.JSX.Element {
  const [waterLoading, setWaterLoading] = useState(false);
  const [fertilizeLoading, setFertilizeLoading] = useState(false);

  async function handleWater(): Promise<void> {
    setWaterLoading(true);

    try {
      await onWater(plant.id);
    } finally {
      setWaterLoading(false);
    }
  }

  async function handleFertilize(): Promise<void> {
    setFertilizeLoading(true);

    try {
      await onFertilize(plant.id);
    } finally {
      setFertilizeLoading(false);
    }
  }

  return (
    <Card>
      <Space align="start" direction="vertical" size="middle" style={{ width: '100%' }}>
        <img
          alt={plant.name}
          height={128}
          src={getApiUrl(plant.thumbnailUrl)}
          style={{ borderRadius: 8, objectFit: 'cover' }}
          width={128}
        />
        <Typography.Title level={5} style={{ margin: 0 }}>
          {plant.name}
        </Typography.Title>
        <CareProgressBar
          intervalDays={plant.wateringIntervalDays}
          label="Полив"
          lastActionDate={plant.lastWateredAt}
        />
        <CareProgressBar
          intervalDays={plant.fertilizingIntervalDays}
          label="Подкормка"
          lastActionDate={plant.lastFertilizedAt}
        />
        <Space wrap>
          <Button loading={waterLoading} onClick={() => void handleWater()}>
            Полил сегодня
          </Button>
          <Button
            loading={fertilizeLoading}
            onClick={() => void handleFertilize()}
          >
            Подкормил сегодня
          </Button>
          <Link to={`/plants/${plant.id}/edit`}>
            <Button>Редактировать</Button>
          </Link>
          <DeletePlantButton
            onConfirm={() => onDelete(plant.id)}
            plantName={plant.name}
          />
        </Space>
      </Space>
    </Card>
  );
}
