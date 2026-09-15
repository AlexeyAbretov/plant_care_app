import createConfig from "@llm/linting";

export default createConfig({
  files: ["src/**/*.ts", "src/**/*.tsx"],
  tsconfigRootDir: import.meta.dirname,
});
