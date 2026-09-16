import { Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CareProgressTrack } from './CareProgressBar.js';

import { getApiUrl } from '../../api/client.js';
import type { Plant } from '../../types/plant.js';
import { DeletePlantButton } from '../plant/DeletePlantButton.js';

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
      <Space
        align="start"
        direction="vertical"
        size="middle"
        style={{ width: '100%' }}
      >
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
        <div
          style={{
            alignItems: 'center',
            columnGap: 8,
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            rowGap: 4,
            width: '100%',
          }}
        >
          <Typography.Text type="secondary">Полив</Typography.Text>
          <CareProgressTrack
            intervalDays={plant.wateringIntervalDays}
            lastActionDate={plant.lastWateredAt}
          />
          <Typography.Text type="secondary">Подкормка</Typography.Text>
          <CareProgressTrack
            intervalDays={plant.fertilizingIntervalDays}
            lastActionDate={plant.lastFertilizedAt}
          />
        </div>
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
