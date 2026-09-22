import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CatalogToolbar } from '../CatalogToolbar';

const meta = {
  title: 'Components/CatalogToolbar',
  component: CatalogToolbar,
  args: {
    categoriesDrawerOpen: false,
    disabled: false,
    onCategoriesDrawerOpenChange: fn(),
    onSortChange: fn(),
    sort: 'watering',
  },
} satisfies Meta<typeof CatalogToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Watering: Story = {
  name: 'По поливу',
};

export const Fertilizing: Story = {
  name: 'По подкормке',
  args: {
    sort: 'fertilizing',
  },
};

export const CategoriesOpen: Story = {
  name: 'Категории открыты',
  args: {
    categoriesDrawerOpen: true,
  },
};

export const Disabled: Story = {
  name: 'Недоступна',
  args: {
    disabled: true,
  },
};
