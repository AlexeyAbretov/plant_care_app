import '@ant-design/v5-patch-for-react-19';
import 'dayjs/locale/ru';
import '../src/index.css';

import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';

dayjs.locale('ru');

const isStringList = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
};

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <ConfigProvider locale={ruRU}>
        <MemoryRouter
          initialEntries={
            isStringList(context.parameters.initialEntries)
              ? context.parameters.initialEntries
              : ['/']
          }
          key={context.id}
        >
          <Story />
        </MemoryRouter>
      </ConfigProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
