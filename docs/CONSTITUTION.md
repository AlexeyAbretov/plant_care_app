# Конституция проекта «Контроль ухода за растениями»

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React, TypeScript, Vite, Ant Design (`ru_RU`), React Router |
| Backend | Node.js ≥ 22, TypeScript, Express |
| База данных | MongoDB (dev — Docker Compose) |
| Файлы изображений | MongoDB GridFS |
| LLM | Ollama, модель `qwen3-vl:8b` (server-side, без выбора модели в UI) |
| Lint | ESLint 9 + Prettier через `@llm/linting` (in-repo, `packages/linting`) |

## Архитектура

```
Браузер (React SPA)
    ↓ REST API
Backend (Express)
    ↓                    ↓
MongoDB (+ GridFS)    Ollama (локально)
```

- Frontend обращается только к backend REST API.
- Распознавание изображений выполняется на backend через Ollama.
- Изображения растений хранятся в GridFS; метаданные — в коллекциях MongoDB.

## Frontend: структура и соглашения

Исходники SPA — `apps/web/src`. Слои и назначение:

| Каталог | Назначение |
|---------|------------|
| `pages/` | Экраны маршрутов: каталог, добавление, редактирование |
| `components/` | Переиспользуемый UI (`AppLayout`, `RetryAlert`, домены `catalog/`, `plant/`) |
| `api/` | HTTP-клиент (`client.ts`) и вызовы REST (`plants.ts`) |
| `hooks/` | React-хуки (например, `usePlantsCatalog`) |
| `types/` | Общие TypeScript-типы (модель растения и т. п.) |
| `config.ts` | Конфигурация из `import.meta.env` |

Дерево (баррели — `index.ts` в папках компонентов и страниц):

```
apps/web/src/
├── App.tsx, main.tsx
├── api/
├── components/
│   ├── index.ts          # публичный баррель UI
│   ├── AppLayout/
│   ├── RetryAlert/
│   ├── catalog/          # PlantCard, CatalogToolbar, CareProgressBar
│   └── plant/            # PlantForm, ImageUpload, ConditionButton, …
├── hooks/
├── pages/
│   ├── index.ts
│   ├── CatalogPage/
│   ├── AddPage/
│   └── EditPlantPage/
└── types/
```

**Маршруты** (`App.tsx`, React Router):

| Путь | Страница |
|------|----------|
| `/` | `CatalogPage` |
| `/add` | `AddPage` |
| `/plants/:id/edit` | `EditPlantPage` |

Оболочка — `AppLayout`; локаль Ant Design — `ru_RU`.

**Импорты:**

Алиасы (`tsconfig.app.json`, `vite.config.ts`): `@api`, `@components`, `@config`, `@hooks`, `@pages`, `@types` → соответствующие каталоги (или `config.ts`) в `src/`.

- Между корневыми каталогами `src` — только алиасы, не `../../api` и не `./components`.
- Внутри одной папки/фичи — относительные `./` и `../` (соседи в `plant/`, `catalog/` и т. п.).
- Страницы и код вне `components/plant/**` и `components/catalog/**` импортируют UI только из барреля `@components`, а не из подпутей `plant/` и `catalog/` (ESLint `no-restricted-imports` в `apps/web/eslint.config.js`).
- Реэкспорт доменов — через `components/index.ts`; страницы маршрутов — баррель `@pages`.
- Относительные импорты **без** суффикса `.js` (отдельное ограничение ESLint для web).

**Колокация утилит компонента:**

Чистые функции, которые относятся к одному компоненту, лежат в папке этого компонента файлом `ComponentName.utils.ts`.

- Если их вызывает только сам компонент — относительный импорт (`./ComponentName.utils`), в баррель не реэкспортируют. Пример: `CareProgressBar.utils.ts`.
- Если их вызывают страницы — реэкспорт через баррель компонента и `@components` (страницы не импортируют `plant/` / `catalog/` напрямую). Пример: `PlantForm.utils.ts` (`mapFormValuesToPayload`, `mapPlantToFormValues`).

Каталог `src/utils/` заводят, когда появится код с несколькими независимыми потребителями вне одного компонента.

Прогресс полива/подкормки в UI считается в `components/catalog/CareProgressBar/CareProgressBar.utils.ts` по тем же правилам, что в разделе «Прогресс-бар ухода» ниже.

## Границы MVP

MVP **закрыт**: этапы 0–6 выполнены, см. [MVP_PLAN.md](MVP_PLAN.md).

**В scope:**

- UI только на русском языке
- Загрузка фото, генерация превью 128×128
- Распознавание через Ollama (`qwen3-vl:8b`): название, описание, параметры, уход, категория
- Интервалы полива/подкормки: LLM предлагает, пользователь может уточнить
- Категория — произвольная строка с возможностью правки
- Даты последнего полива/подкормки (по умолчанию «сегодня»)
- Каталог с прогресс-барами, сортировкой и фильтром по категории
- Быстрые действия «Полил сегодня» / «Подкормил сегодня»
- CRUD: создание, редактирование, удаление

**Вне scope:**

- PWA / offline
- Аутентификация и мультипользовательский режим
- Push-напоминания, история ухода
- Выбор модели Ollama в UI

## Переменные окружения

Dev-окружение настраивается **одним** файлом `.env` в корне репозитория (шаблон — `.env.example`).

### Backend (`apps/api`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3001` | Порт HTTP API |
| `MONGODB_URI` | `mongodb://localhost:27017/plant_care` | Строка подключения MongoDB |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Базовый URL Ollama |

### Frontend (`apps/web`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `WEB_PORT` | `5173` | Порт Vite dev server |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Базовый URL backend API |

### Docker (MongoDB)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `MONGO_PORT` | `27017` | Host-порт MongoDB в `docker-compose.yml` |

## Прогресс-бар ухода

Формула заполнения:

```
progress = clamp(1 − daysSince / intervalDays, 0, 1)
```

где `daysSince` — число дней с последнего полива (или подкормки), `intervalDays` — интервал в днях.

Цвета:

| Условие | Цвет |
|---------|------|
| progress > 75% | зелёный |
| 50% < progress ≤ 75% | жёлтый |
| 25% < progress ≤ 50% | оранжевый |
| 0 < progress ≤ 25% | красный |
| progress = 0% | красный (заливка и фон полосы) |
| просрочено | красный |

## Изображения

- Максимальный размер загружаемого файла: **5 МБ**
- Превью для каталога: **128×128** px
- Хранение: **GridFS** в MongoDB
