import createConfig from "@llm/linting";

export default createConfig({
  files: ["apps/*/src/**/*.ts", "apps/*/src/**/*.tsx"],
  ignores: ["**/dist/**", "**/node_modules/**"],
  tsconfigRootDir: import.meta.dirname,
});
