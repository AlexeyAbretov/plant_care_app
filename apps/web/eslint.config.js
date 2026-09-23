import { createWebConfig } from '@llm/linting/web';

export default createWebConfig({
  tsconfigRootDir: import.meta.dirname,
});
