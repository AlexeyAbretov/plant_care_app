import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CategoryCloudDrawer } from '../CategoryCloudDrawer';

const categoryOptions = [
  'Декоративно-лиственные',
  'Суккуленты',
  'Цветущие',
  'Пряные травы',
];

const meta = {
  title: 'Components/CategoryCloudDrawer',
  component: CategoryCloudDrawer,
  args: {
    categories: [],
    categoryOptions,
    disabled: false,
    embedded: true,
    onCategoriesChange: fn(),
    onOpenChange: fn(),
    open: true,
  },
} satisfies Meta<typeof CategoryCloudDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Embedded: Story = {
  name: 'Панель',
};

export const Selected: Story = {
  name: 'Выбранные',
  args: {
    categories: ['Суккуленты', 'Цветущие'],
  },
};

export const Empty: Story = {
  name: 'Нет категорий',
  args: {
    categoryOptions: [],
  },
};

export const Disabled: Story = {
  name: 'Недоступна',
  args: {
    categories: ['Суккуленты'],
    disabled: true,
  },
};

export const Drawer: Story = {
  name: 'Выдвижная панель',
  args: {
    embedded: false,
  },
};
