import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import type { PlantConditionResult } from '@types';

import { PlantConditionButton } from '../PlantConditionButton';

const assessment: PlantConditionResult = {
  assessment: 'Листья плотные, без пятен.',
  healthLevel: 'good',
  recommendations: ['Продолжайте текущий уход'],
};

const meta = {
  title: 'Components/PlantConditionButton',
  component: PlantConditionButton,
  args: {
    assess: fn(async () => assessment),
    disabled: false,
  },
} satisfies Meta<typeof PlantConditionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const openDialog = async (canvasElement: HTMLElement): Promise<void> => {
  const canvas = within(canvasElement);

  await userEvent.click(canvas.getByRole('button', { name: 'Состояние' }));
};

export const Ready: Story = {
  name: 'Готова',
};

export const Loading: Story = {
  name: 'Оценка',
  args: {
    assess: fn(
      () =>
        new Promise<PlantConditionResult>(() => {
          return undefined;
        }),
    ),
  },
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);

    await expect(
      await within(document.body).findByText('Оцениваем состояние…'),
    ).toBeInTheDocument();
  },
};

export const Result: Story = {
  name: 'Результат',
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);

    await expect(
      await within(document.body).findByText('Хорошее'),
    ).toBeInTheDocument();
  },
};

export const Failed: Story = {
  name: 'Ошибка',
  args: {
    assess: fn(async () => {
      throw new Error('Ollama недоступна');
    }),
  },
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);

    await expect(
      await within(document.body).findByText('Ollama недоступна'),
    ).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: 'Нет фото',
  args: {
    disabled: true,
    disabledTooltip: 'Сначала загрузите фото',
  },
};
