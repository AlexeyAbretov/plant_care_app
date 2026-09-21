import { Button, Card, Flex, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient, plantsApi } from '@api';

import type { PlantCardProps } from './PlantCard.types';

import { CareProgressTrack } from '../CareProgressBar';
import { PlantConditionButton } from '../ConditionButton';
import { DeletePlantButton } from '../DeletePlantButton';
import { PlantImagePreview } from '../PlantImagePreview';

const actionButtonStyle: React.CSSProperties = {
  height: 'auto',
  maxWidth: '100%',
  minHeight: 32,
  minWidth: 0,
  whiteSpace: 'normal',
};

export const PlantCard = ({
  plant,
  onWater,
  onFertilize,
  onDelete,
}: PlantCardProps): React.JSX.Element => {
  const [waterLoading, setWaterLoading] = useState(false);
  const [fertilizeLoading, setFertilizeLoading] = useState(false);

  const handleWater = async (): Promise<void> => {
    setWaterLoading(true);

    try {
      await onWater(plant.id);
    } finally {
      setWaterLoading(false);
    }
  };

  const handleFertilize = async (): Promise<void> => {
    setFertilizeLoading(true);

    try {
      await onFertilize(plant.id);
    } finally {
      setFertilizeLoading(false);
    }
  };

  return (
    <Card style={{ minWidth: 0, width: '100%' }}>
      <Space
        align="start"
        direction="vertical"
        size="middle"
        style={{ minWidth: 0, width: '100%' }}
        styles={{ item: { alignSelf: 'stretch', minWidth: 0, width: '100%' } }}
      >
        <PlantImagePreview
          alt={plant.name}
          height={128}
          previewSrc={apiClient.url(plant.imageUrl)}
          src={apiClient.url(plant.thumbnailUrl)}
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
        <Flex gap={8} wrap="wrap" style={{ minWidth: 0, width: '100%' }}>
          <Button
            loading={waterLoading}
            onClick={() => void handleWater()}
            style={actionButtonStyle}
          >
            Полил сегодня
          </Button>
          <Button
            loading={fertilizeLoading}
            onClick={() => void handleFertilize()}
            style={actionButtonStyle}
          >
            Подкормил сегодня
          </Button>
          <PlantConditionButton
            assess={() => plantsApi.assessConditionById(plant.id)}
          />
          <Link
            to={`/plants/${plant.id}/edit`}
            style={{ maxWidth: '100%', minWidth: 0 }}
          >
            <Button style={actionButtonStyle}>Редактировать</Button>
          </Link>
          <DeletePlantButton
            onConfirm={() => onDelete(plant.id)}
            plantName={plant.name}
          />
        </Flex>
      </Space>
    </Card>
  );
};
