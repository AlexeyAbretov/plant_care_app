import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import storybook from "eslint-plugin-storybook";

import { createConfig } from "./index.js";

const aliasImportMessage =
  "Use a path alias (@folder) for every directory and root .ts module in src.";

/**
 * Directories in `src` plus root `*.ts` modules (`config.ts` → `config`).
 *
 * @param {string} rootDir
 * @returns {string[]}
 */
function srcRootNames(rootDir) {
  const srcDir = join(rootDir, "src");
  let entries;

  try {
    entries = readdirSync(srcDir);
  } catch {
    return [];
  }

  const names = [];

  for (const entry of entries) {
    if (entry.startsWith(".")) {
      continue;
    }

    const fullPath = join(srcDir, entry);

    if (statSync(fullPath).isDirectory()) {
      names.push(entry);
      continue;
    }

    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      names.push(entry.slice(0, -3));
    }
  }

  return names;
}

/**
 * @param {string} value
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} rootDir
 */
function aliasImportPatterns(rootDir) {
  const names = srcRootNames(rootDir);

  if (names.length === 0) {
    return [];
  }

  const group = names.map(escapeRegExp).join("|");

  return [
    {
      regex: `^(\\.\\./)+(${group})(/|$)`,
      message: aliasImportMessage,
    },
    {
      regex: `^\\./(${group})(/|$)`,
      message: aliasImportMessage,
    },
  ];
}

/**
 * @param {string[]} files
 * @param {string} rootDir
 */
function createWebOverrides(files, rootDir) {
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
            ...aliasImportPatterns(rootDir),
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
  const rootDir = options.tsconfigRootDir ?? process.cwd();

  return [
    ...createConfig({ ...options, files }),
    createWebOverrides(files, rootDir),
    ...storybook.configs["flat/recommended"],
  ];
}
