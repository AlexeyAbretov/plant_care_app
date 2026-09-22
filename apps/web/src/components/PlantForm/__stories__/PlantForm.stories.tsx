import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from 'antd';
import { fn } from 'storybook/test';

import { addCalendarDays, formatIsoDate, todayIsoDate } from '@utils';

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
  lastWateredAt: todayIsoDate(),
  lastFertilizedAt: formatIsoDate(addCalendarDays(new Date(), -10)),
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

export const WithRecognize: Story = {
  name: 'С распознаванием',
  args: {
    onRecognize: fn(),
  },
  parameters: {
    formValues: filledValues,
  },
};

export const RecognizeLoading: Story = {
  name: 'Распознавание',
  args: {
    onRecognize: fn(),
    recognizeLoading: true,
  },
  parameters: {
    formValues: filledValues,
  },
};
