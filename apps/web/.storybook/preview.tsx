import 'dayjs/locale/ru';
import '../src/index.css';

import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';

dayjs.locale('ru');

const preview: Preview = {
  decorators: [
    (Story) => (
      <ConfigProvider locale={ruRU}>
        <MemoryRouter>
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
