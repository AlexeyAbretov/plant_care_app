import storybook from "eslint-plugin-storybook";

import { createConfig } from "./index.js";

const aliasImportMessage =
  "Use path aliases (@api, @components, @containers, @hooks, " +
  "@pages, @types, @utils, @config) instead of relative paths to src " +
  "root folders.";

/**
 * @param {string[]} files
 */
function createWebOverrides(files) {
  return {
    files,
    rules: {
      "func-style": ["error", "expression"],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*", "../../*", "../../../*"],
              importNamePattern: "^.+\\.js$",
              message:
                "Relative imports must not include the .js file extension.",
            },
            {
              regex:
                "^(\\.\\./)+(api|components|containers|hooks|pages|types|" +
                "utils)(/|$)",
              message: aliasImportMessage,
            },
            {
              regex: "^(\\.\\./)+config$",
              message: "Use @config instead of a relative path.",
            },
            {
              regex:
                "^\\./(api|components|containers|hooks|pages|types|utils)" +
                "(/|$)",
              message: aliasImportMessage,
            },
            {
              regex: "^\\./config$",
              message: "Use @config instead of ./config.",
            },
          ],
        },
      ],
    },
  };
}

/**
 * Frontend preset: base config, arrow functions, alias imports, Storybook.
 * Import from `@llm/linting/web`. `createConfig` does not load this module.
 *
 * @param {object} [options] Same fields as `createConfig`.
 * @param {string[]} [options.files] Default: `src` TypeScript and TSX.
 */
export function createWebConfig(options = {}) {
  const files = options.files ?? ["src/**/*.ts", "src/**/*.tsx"];

  return [
    ...createConfig({ ...options, files }),
    createWebOverrides(files),
    ...storybook.configs["flat/recommended"],
  ];
}
