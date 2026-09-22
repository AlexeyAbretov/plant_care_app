import createConfig from '@llm/linting';
import storybook from 'eslint-plugin-storybook';

const aliasImportMessage =
  'Use path aliases (@api, @components, @containers, @hooks, ' +
  '@pages, @types, @config) instead of relative paths to src ' +
  'root folders.';

export default [
  ...createConfig({
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'func-style': ['error', 'expression'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*', '../../*', '../../../*'],
              importNamePattern: '^.+\\.js$',
              message:
                'Relative imports must not include the .js file extension.',
            },
            {
              regex:
                '^(\\.\\./)+(api|components|containers|hooks|pages|types)' +
                '(/|$)',
              message: aliasImportMessage,
            },
            {
              regex: '^(\\.\\./)+config$',
              message: 'Use @config instead of a relative path.',
            },
            {
              regex:
                '^\\./(api|components|containers|hooks|pages|types)(/|$)',
              message: aliasImportMessage,
            },
            {
              regex: '^\\./config$',
              message: 'Use @config instead of ./config.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/components/plant/**', 'src/components/catalog/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/components/plant',
                '**/components/plant/*',
                '**/components/catalog',
                '**/components/catalog/*',
              ],
              message:
                'Import from @components instead of plant/catalog subpaths.',
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
];
