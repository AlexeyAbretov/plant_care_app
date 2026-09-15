import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/**
 * Shared ESLint 9 flat config (function style, Elvis, import groups, 80 cols).
 *
 * @param {object} [options]
 * @param {string[]} [options.files] Paths to lint. Default: src TypeScript files
 * @param {string[]} [options.ignores] Default: dist and test
 * @param {string} [options.tsconfigRootDir] Consuming project root
 *   (`import.meta.dirname`). Needed for type-aware Elvis rules.
 */
export function createConfig(options = {}) {
  const files = options.files ?? ["src/**/*.ts"];
  const ignores = options.ignores ?? ["dist/**", "test/**"];
  const tsconfigRootDir = options.tsconfigRootDir;

  return [
    {
      ignores,
    },
    {
      files,
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          projectService: true,
          ...(tsconfigRootDir ? { tsconfigRootDir } : {}),
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      plugins: {
        "@stylistic": stylistic,
        "@typescript-eslint": tsPlugin,
        "simple-import-sort": simpleImportSort,
      },
      rules: {
        curly: ["error", "all"],
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
        "simple-import-sort/imports": [
          "error",
          {
            groups: [
              ["^\\u0000"],
              ["^node:"],
              ["^@\\w+/", "^\\w"],
              ["^@"],
              ["^\\./"],
              ["^\\.\\."],
            ],
          },
        ],
        "simple-import-sort/exports": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: {
              bigint: true,
              boolean: true,
              number: true,
              string: true,
            },
          },
        ],
        "@stylistic/padding-line-between-statements": [
          "error",
          { blankLine: "always", prev: "*", next: "return" },
          { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
          {
            blankLine: "any",
            prev: ["const", "let", "var"],
            next: ["const", "let", "var"],
          },
          { blankLine: "always", prev: "block-like", next: "*" },
          { blankLine: "always", prev: "*", next: "if" },
        ],
      },
    },
    eslintPluginPrettierRecommended,
    {
      files,
      rules: {
        curly: ["error", "all"],
        "@stylistic/max-len": [
          "error",
          {
            code: 80,
            ignoreUrls: true,
            ignoreRegExpLiterals: true,
          },
        ],
      },
    },
  ];
}

export default createConfig;
