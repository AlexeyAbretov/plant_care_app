import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppLayout } from '../AppLayout';

const meta = {
  title: 'Components/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    children: 'Список растений',
  },
} satisfies Meta<typeof AppLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  name: 'Каталог',
};

export const Add: Story = {
  name: 'Добавление',
  parameters: {
    initialEntries: ['/add'],
  },
  args: {
    children: 'Форма нового растения',
  },
};

export const Edit: Story = {
  name: 'Редактирование',
  parameters: {
    initialEntries: ['/plants/plant-1/edit'],
  },
  args: {
    children: 'Карточка растения',
  },
};

export const WithHeaderExtra: Story = {
  name: 'С блоком в шапке',
  args: {
    headerExtra: <span style={{ color: '#fff' }}>☀️ +18°</span>,
  },
};
