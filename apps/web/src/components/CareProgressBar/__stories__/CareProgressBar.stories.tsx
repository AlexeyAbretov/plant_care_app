import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';

import { CareProgressTrack } from '../CareProgressBar';

const daysAgo = (days: number): string => {
  return dayjs().subtract(days, 'day').startOf('day').toISOString();
};

const meta = {
  title: 'Components/CareProgressBar',
  component: CareProgressTrack,
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    intervalDays: 7,
    lastActionDate: daysAgo(0),
  },
} satisfies Meta<typeof CareProgressTrack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fresh: Story = {
  name: 'Только что',
};

export const Midway: Story = {
  name: 'Середина интервала',
  args: {
    lastActionDate: daysAgo(2),
  },
};

export const DueSoon: Story = {
  name: 'Скоро срок',
  args: {
    lastActionDate: daysAgo(4),
  },
};

export const Due: Story = {
  name: 'Срок вышел',
  args: {
    lastActionDate: daysAgo(7),
  },
};

export const Overdue: Story = {
  name: 'Просрочено',
  args: {
    lastActionDate: daysAgo(10),
  },
};
