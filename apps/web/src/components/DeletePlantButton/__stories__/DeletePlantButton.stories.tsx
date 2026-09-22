import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DeletePlantButton } from '../DeletePlantButton';

const meta = {
  title: 'Components/DeletePlantButton',
  component: DeletePlantButton,
  args: {
    disabled: false,
    onConfirm: fn(async () => {}),
    plantName: 'Монстера',
  },
} satisfies Meta<typeof DeletePlantButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  name: 'Готова',
};

export const Confirm: Story = {
  name: 'Подтверждение',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Удалить' }));

    await expect(
      await within(document.body).findByText('Удалить растение?'),
    ).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: 'Недоступна',
  args: {
    disabled: true,
  },
};
