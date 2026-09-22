import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const getAbsolutePath = (value: string): string => {
  return dirname(
    fileURLToPath(import.meta.resolve(`${value}/package.json`)),
  );
};

const config: StorybookConfig = {
  stories: ['../src/**/__stories__/*.stories.@(ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-docs')],
  framework: getAbsolutePath('@storybook/react-vite'),
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      define: {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(''),
      },
    });
  },
};

export default config;
