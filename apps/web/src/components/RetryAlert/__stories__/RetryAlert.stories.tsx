import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { RetryAlert } from '../RetryAlert';

const meta = {
  title: 'Components/RetryAlert',
  component: RetryAlert,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    description: 'Проверьте, что сервис запущен, и повторите запрос.',
    message: 'Не удалось загрузить каталог',
    onRetry: fn(),
    retryDisabled: false,
    retryLoading: false,
    showIcon: true,
    type: 'error',
  },
} satisfies Meta<typeof RetryAlert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Error: Story = {
  name: 'Ошибка',
};

export const Warning: Story = {
  name: 'Предупреждение',
  args: {
    description: undefined,
    message: 'Погода временно недоступна',
    type: 'warning',
  },
};

export const Retrying: Story = {
  name: 'Повтор',
  args: {
    retryLoading: true,
  },
};

export const Closable: Story = {
  name: 'Можно закрыть',
  args: {
    closable: true,
    onClose: fn(),
  },
};
