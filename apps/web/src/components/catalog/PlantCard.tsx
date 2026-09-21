import { Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CareProgressTrack } from './CareProgressBar.js';

import { assessPlantConditionById, getApiUrl } from '../../api/index.js';
import type { Plant } from '../../types/index.js';
import {
  DeletePlantButton,
  PlantConditionButton,
  PlantImagePreview,
} from '../plant/index.js';

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
        styles={{ item: { alignSelf: 'stretch', width: '100%' } }}
      >
        <PlantImagePreview
          alt={plant.name}
          height={128}
          previewSrc={getApiUrl(plant.imageUrl)}
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
          <PlantConditionButton
            assess={() => assessPlantConditionById(plant.id)}
          />
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
