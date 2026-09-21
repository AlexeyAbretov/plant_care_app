# @llm/linting

Общий ESLint 9 + Prettier для TypeScript: `function`, всегда `{}`, Elvis (`?.` / `??`), группы импортов, строка ≤ 80.

## Подключение

Из соседней папки (этот репозиторий ещё не в npm):

```bash
npm i -D eslint prettier typescript "@llm/linting@file:../linting"
```

Путь `file:` — относительно `package.json` потребляющего проекта.

### `eslint.config.js`

```js
import createConfig from "@llm/linting";

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
});
```

Другие пути:

```js
export default createConfig({
  files: ["lib/**/*.ts", "scripts/**/*.ts"],
  ignores: ["dist/**", "coverage/**"],
  tsconfigRootDir: import.meta.dirname,
});
```

Нужен `tsconfig.json` в корне проекта: type-aware правила (`prefer-optional-chain`, `prefer-nullish-coalescing`) читают его через `projectService`.

### Monorepo: локальные правила (`apps/web`)

В workspace-приложениях базовый конфиг из `@llm/linting` можно **расширить** своими блоками `rules`, не дублируя общий стиль. Пример — `apps/web/eslint.config.js`: spread `createConfig(...)`, затем `no-restricted-imports` (запрет `.js` в относительных путях; импорт `plant`/`catalog` только через баррель `components`). Такие правила остаются в потребителе; вынос в `@llm/linting` — только по отдельному решению.

```js
import createConfig from "@llm/linting";

export default [
  ...createConfig({
    files: ["src/**/*.ts", "src/**/*.tsx"],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      /* локальные no-restricted-imports — см. apps/web/eslint.config.js */
    },
  },
];
```

### Prettier

В `package.json`:

```json
{
  "prettier": "@llm/linting/prettier"
}
```

Или `.prettierrc.json`:

```json
"@llm/linting/prettier"
```

### Скрипты

```json
{
  "scripts": {
    "lint": "eslint src --max-warnings=0",
    "lint:fix": "eslint src --fix"
  }
}
```

### Правило для Cursor

Скопировать [`cursor/typescript-functions.mdc`](cursor/typescript-functions.mdc) в `.cursor/rules/` целевого репозитория. В этом monorepo файл уже в `.cursor/rules/`; при обновлении пакета синхронизируйте с `packages/linting/cursor/`. `globs` по умолчанию: `**/*.{ts,tsx}` (React в `apps/web`).
