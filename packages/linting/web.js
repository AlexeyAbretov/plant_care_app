import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import storybook from "eslint-plugin-storybook";

import { createConfig } from "./index.js";

const aliasImportMessage =
  "Use a path alias (@folder) for every directory and root .ts module in src.";

const barrelImportMessage =
  "Import the folder barrel (@features), not a path inside the alias.";

const extensionImportMessage =
  "Do not include a file extension in the import path.";

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

const relativeJsImportPattern = {
  group: ["./*", "../*", "../../*", "../../../*"],
  importNamePattern: "^.+\\.js$",
  message: "Relative imports must not include the .js file extension.",
};

/**
 * @param {string} rootDir
 * @param {{ sameDirectory?: boolean }} [options]
 * `./types` inside `src/types/` is the sibling file `types.ts`.
 * The same path from a file directly in `src/` is the folder.
 */
function aliasImportPatterns(rootDir, options = {}) {
  const names = srcRootNames(rootDir);

  if (names.length === 0) {
    return [];
  }

  const group = names.map(escapeRegExp).join("|");
  const patterns = [
    {
      regex: `^(\\.\\./)+(${group})(/|$)`,
      message: aliasImportMessage,
    },
  ];

  if (options.sameDirectory) {
    patterns.push({
      regex: `^\\./(${group})(/|$)`,
      message: aliasImportMessage,
    });
  }

  patterns.push(
    {
      regex: `^@(${group})/.+`,
      message: barrelImportMessage,
    },
    {
      regex: "\\.(tsx?|jsx?)$",
      message: extensionImportMessage,
    },
  );

  return patterns;
}

/**
 * @param {string} rootDir
 * @param {{ sameDirectory?: boolean }} [options]
 */
function restrictedImports(rootDir, options) {
  return [
    "error",
    {
      patterns: [
        relativeJsImportPattern,
        ...aliasImportPatterns(rootDir, options),
      ],
    },
  ];
}

/**
 * @param {string[]} files
 * @param {string} rootDir
 */
function createWebOverrides(files, rootDir) {
  return [
    {
      files,
      rules: {
        "func-style": ["error", "expression"],
        "no-restricted-imports": restrictedImports(rootDir),
      },
    },
    {
      files: ["src/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": restrictedImports(rootDir, {
          sameDirectory: true,
        }),
      },
    },
  ];
}

/**
 * JSON with comments and trailing commas, as in tsconfig.
 * `/*` inside a string stays a string.
 *
 * @param {string} source
 */
function parseJsonc(source) {
  let text = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === '"') {
      const start = index;
      index += 1;

      while (index < source.length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }

        if (source[index] === '"') {
          index += 1;
          break;
        }

        index += 1;
      }

      text += source.slice(start, index);
      continue;
    }

    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }

      continue;
    }

    if (char === "/" && source[index + 1] === "*") {
      index += 2;

      while (
        index < source.length &&
        !(source[index] === "*" && source[index + 1] === "/")
      ) {
        index += 1;
      }

      index += 2;
      continue;
    }

    text += char;
    index += 1;
  }

  return JSON.parse(text.replace(/,\s*([}\]])/g, "$1"));
}

/**
 * @param {unknown} paths
 * @returns {string[]}
 */
function wildcardAliasKeys(paths) {
  if (!paths || typeof paths !== "object") {
    return [];
  }

  const keys = [];

  for (const [key, values] of Object.entries(paths)) {
    const list = Array.isArray(values) ? values : [values];
    const valueHasWildcard = list.some(
      (value) => typeof value === "string" && value.includes("/*"),
    );

    if (key.includes("/*") || valueHasWildcard) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function tsconfigFiles(dir) {
  let names;

  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  return names
    .filter((name) => /^tsconfig(\..+)?\.json$/.test(name))
    .map((name) => join(dir, name));
}

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
function wildcardAliasViolations(rootDir) {
  const pending = tsconfigFiles(rootDir);
  const seen = new Set();
  const violations = [];

  while (pending.length > 0) {
    const file = pending.pop();

    if (!file || seen.has(file)) {
      continue;
    }

    seen.add(file);

    let data;

    try {
      data = parseJsonc(readFileSync(file, "utf8"));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      throw new Error(`Cannot parse ${file}: ${reason}`);
    }

    for (const key of wildcardAliasKeys(data?.compilerOptions?.paths)) {
      violations.push(`${file}: "${key}"`);
    }

    const extended = data?.extends;
    const list = Array.isArray(extended) ? extended : [extended];

    for (const item of list) {
      if (typeof item === "string" && item.startsWith(".")) {
        pending.push(join(dirname(file), item));
      }
    }
  }

  return violations;
}

/**
 * @param {string} rootDir
 */
function assertNoWildcardAliases(rootDir) {
  const violations = wildcardAliasViolations(rootDir);

  if (violations.length === 0) {
    return;
  }

  throw new Error(
    [
      "tsconfig paths must not use /* aliases.",
      "Point each alias at the folder barrel.",
      ...violations,
    ].join("\n"),
  );
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

  assertNoWildcardAliases(rootDir);

  return [
    ...createConfig({ ...options, files }),
    ...createWebOverrides(files, rootDir),
    ...storybook.configs["flat/recommended"],
  ];
}
