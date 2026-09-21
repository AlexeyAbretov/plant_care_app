import createConfig from "@llm/linting";

export default [
  ...createConfig({
    files: ["src/**/*.ts", "src/**/*.tsx"],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
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
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "src/components/plant/**",
      "src/components/catalog/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/components/plant",
                "**/components/plant/*",
                "**/components/catalog",
                "**/components/catalog/*",
              ],
              message:
                "Import from the components barrel (../components) " +
                "instead of plant/catalog subpaths.",
            },
          ],
        },
      ],
    },
  },
];
