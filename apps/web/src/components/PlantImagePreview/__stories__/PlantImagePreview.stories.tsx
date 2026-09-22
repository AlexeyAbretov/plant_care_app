import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlantImagePreview } from '../PlantImagePreview';

const src = '/storybook/plant.svg';

const meta = {
  title: 'Components/PlantImagePreview',
  component: PlantImagePreview,
  args: {
    alt: 'Монстера',
    src,
    width: 240,
  },
} satisfies Meta<typeof PlantImagePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
  name: 'Одно фото',
};

export const Gallery: Story = {
  name: 'Несколько фото',
  args: {
    previewIndex: 1,
    previewSrcs: [src, src, src],
  },
};
