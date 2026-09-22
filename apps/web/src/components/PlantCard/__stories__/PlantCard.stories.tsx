import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { fn } from 'storybook/test';

import type { Plant, WateringClimate } from '@types';

import { PlantCard } from '../PlantCard';

const daysAgo = (days: number): string => {
  return dayjs().subtract(days, 'day').startOf('day').toISOString();
};

const createPlant = (overrides: Partial<Plant> = {}): Plant => {
  return {
    id: 'plant-1',
    name: 'Монстера',
    description: 'Крупные резные листья.',
    category: 'Декоративно-лиственные',
    lightPreference: 'Рассеянный свет',
    sizeInfo: 'до 1.5 м',
    locationKind: 'indoor',
    wateringIntervalDays: 7,
    fertilizingIntervalDays: 30,
    wateringNotes: '',
    fertilizingNotes: '',
    lastWateredAt: daysAgo(2),
    lastFertilizedAt: daysAgo(10),
    imageUrl: '/storybook/plant.svg',
    thumbnailUrl: '/storybook/plant.svg',
    createdAt: daysAgo(40),
    updatedAt: daysAgo(2),
    ...overrides,
  };
};

const heatingClimate: WateringClimate = {
  heatingSeason: true,
  heat: false,
  overcast: false,
  precipitationLikely: false,
};

const meta = {
  title: 'Components/PlantCard',
  component: PlantCard,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    plant: createPlant(),
    imageSrc: '/storybook/plant.svg',
    previewSrc: '/storybook/plant.svg',
    wateringClimate: null,
    onWater: fn(async () => {}),
    onFertilize: fn(async () => {}),
    onDelete: fn(async () => {}),
    onAssess: fn(async () => ({
      assessment: 'Листья плотные, без пятен.',
      healthLevel: 'good',
      recommendations: ['Продолжайте текущий уход'],
    })),
  },
} satisfies Meta<typeof PlantCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnSchedule: Story = {
  name: 'По графику',
};

export const WateringOverdue: Story = {
  name: 'Полив просрочен',
  args: {
    plant: createPlant({
      lastWateredAt: daysAgo(10),
    }),
  },
};

export const HeatingSeason: Story = {
  name: 'Отопительный сезон',
  args: {
    plant: createPlant({
      lastWateredAt: daysAgo(4),
    }),
    wateringClimate: heatingClimate,
  },
};
