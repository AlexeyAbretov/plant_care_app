# @llm/linting

Общий слой, который переносится в другой репозиторий целиком:

| Что | Где | Куда попадает у потребителя |
|-----|-----|------------------------------|
| ESLint 9 + Prettier | `index.js`, `prettier.json` | `eslint.config.js`, поле `prettier` |
| Стиль TypeScript для агента | `cursor/typescript-style.mdc` | `.cursor/rules/` через `sync-cursor` |
| Шаблон React | `cursor/react/`, [docs/frontend.md](docs/frontend.md) | `.cursor/rules/react/` |

В ESLint пакета: `function` declaration (по умолчанию), всегда `{}`, Elvis (`?.` / `??`), группы импортов, строка ≤ 80. Frontend подключает `createWebConfig` из `@llm/linting/web`: стрелки, алиасы корневых каталогов `src` и `eslint-plugin-storybook`. `createConfig` этот модуль не загружает — API остаётся на `function`.

Доменные имена, маршруты, формулы и env остаются в конституции проекта.

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

`packages/linting/**` не проверяется: этот путь добавляется к `ignores` всегда, даже если передан свой список.

### Frontend

`createWebConfig` из `@llm/linting/web` — базовый конфиг плюс правила только для frontend: `func-style: expression`, `no-restricted-imports` (без `.js` в относительных путях; между корневыми каталогами `src` — алиасы `@api`, `@components`, `@containers`, `@hooks`, `@pages`, `@types`, `@utils`, `@config`) и `eslint-plugin-storybook` (`flat/recommended`). По умолчанию проверяет `src/**/*.ts` и `src/**/*.tsx`.

```js
import { createWebConfig } from "@llm/linting/web";

export default createWebConfig({
  tsconfigRootDir: import.meta.dirname,
});
```

Шаблон слоёв — [docs/frontend.md](docs/frontend.md).

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

### Правила Cursor

Источник — каталог [`cursor/`](cursor/). В корне потребителя:

```bash
npm run sync-cursor
```

Если пакет подключён не как workspace этого monorepo:

```bash
node node_modules/@llm/linting/scripts/sync-cursor.js
```

Команда копирует `cursor/` в `.cursor/rules/` и перезаписывает только эти файлы. Правила, которых нет в пакете, остаются на месте.

Править общие правила в `packages/linting/cursor/`, затем снова запустить синхронизацию. Стори, типы, запрет API и запрет импорта контейнеров в `components/` ищут `components/`, `pages/`, `containers/` и `hooks/` на любой глубине. Стрелки (`frontend-functions.mdc`) и баррели (`module-barrels.mdc`) — любые `*.ts` и `*.tsx`. Шаблон слоёв — [docs/frontend.md](docs/frontend.md).
