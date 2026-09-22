import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PlantImageGallery } from '../PlantImageGallery';

const assess = fn(async () => {
  return {
    assessment: 'Листья плотные, без пятен.',
    healthLevel: 'good' as const,
    recommendations: ['Продолжайте текущий уход'],
  };
});

const meta = {
  title: 'Components/PlantImageGallery',
  component: PlantImageGallery,
  args: {
    disabled: false,
    onAddFiles: fn(async () => {}),
    onDelete: fn(async () => {}),
    onSetDefault: fn(async () => {}),
    onAssess: assess,
    images: [
      {
        id: 'image-1',
        src: '/storybook/plant.svg',
        previewSrc: '/storybook/plant.svg',
        isDefault: true,
        isCover: true,
      },
      {
        id: 'image-2',
        src: '/storybook/plant.svg',
        previewSrc: '/storybook/plant.svg',
        isDefault: false,
        isCover: false,
      },
    ],
  },
} satisfies Meta<typeof PlantImageGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithDefault: Story = {
  name: 'Несколько фото',
};

export const LatestOnTile: Story = {
  name: 'На плитке последнее',
  args: {
    images: [
      {
        id: 'image-1',
        src: '/storybook/plant.svg',
        previewSrc: '/storybook/plant.svg',
        isDefault: false,
        isCover: false,
      },
      {
        id: 'image-2',
        src: '/storybook/plant.svg',
        previewSrc: '/storybook/plant.svg',
        isDefault: false,
        isCover: true,
      },
    ],
  },
};

export const SingleImage: Story = {
  name: 'Одно фото',
  args: {
    images: [
      {
        id: 'image-1',
        src: '/storybook/plant.svg',
        previewSrc: '/storybook/plant.svg',
        isDefault: false,
        isCover: true,
      },
    ],
  },
};
