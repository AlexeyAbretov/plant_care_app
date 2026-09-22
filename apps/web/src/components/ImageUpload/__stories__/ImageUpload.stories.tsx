import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ImageUpload } from '../ImageUpload';

const selectedFile = new File(['plant'], 'monstera.png', {
  type: 'image/png',
});

const meta = {
  title: 'Components/ImageUpload',
  component: ImageUpload,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    disabled: false,
    file: null,
    onFileSelect: fn(),
    previewOriginalUrl: null,
    previewUrl: null,
  },
} satisfies Meta<typeof ImageUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: 'Пусто',
};

export const WithPreview: Story = {
  name: 'С фото',
  args: {
    file: selectedFile,
    previewOriginalUrl: '/storybook/plant.svg',
    previewUrl: '/storybook/plant.svg',
  },
};

export const Disabled: Story = {
  name: 'Недоступна',
  args: {
    disabled: true,
    file: selectedFile,
    previewUrl: '/storybook/plant.svg',
  },
};
