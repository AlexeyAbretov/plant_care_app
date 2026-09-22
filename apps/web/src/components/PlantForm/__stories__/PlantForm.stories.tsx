import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from 'antd';
import dayjs from 'dayjs';

import { PlantForm } from '../PlantForm';
import type { PlantFormValues } from '../PlantForm.types';

const filledValues: Partial<PlantFormValues> = {
  name: 'Монстера',
  description: 'Крупные резные листья.',
  category: 'Декоративно-лиственные',
  lightPreference: 'Рассеянный свет',
  sizeInfo: 'до 1.5 м',
  locationKind: 'indoor',
  wateringIntervalDays: 7,
  fertilizingIntervalDays: 30,
  wateringNotes: 'После просыхания верхнего слоя.',
  fertilizingNotes: 'Удобрение для декоративно-лиственных.',
  lastWateredAt: dayjs().startOf('day'),
  lastFertilizedAt: dayjs().subtract(10, 'day').startOf('day'),
};

const meta = {
  title: 'Components/PlantForm',
  component: PlantForm,
  decorators: [
    (Story, context) => (
      <Form
        initialValues={context.parameters.formValues}
        key={context.id}
        layout="vertical"
        style={{ maxWidth: 480, width: '100%' }}
      >
        <Story />
      </Form>
    ),
  ],
  args: {
    disabled: false,
  },
} satisfies Meta<typeof PlantForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: 'Пустая',
};

export const Filled: Story = {
  name: 'Заполненная',
  parameters: {
    formValues: filledValues,
  },
};

export const Disabled: Story = {
  name: 'Недоступна',
  args: {
    disabled: true,
  },
  parameters: {
    formValues: filledValues,
  },
};
