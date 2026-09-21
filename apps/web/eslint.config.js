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
];
