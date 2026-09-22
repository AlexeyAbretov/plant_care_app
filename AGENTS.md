# Инструкции для агентов

## Требования

- **Node.js** ≥ 22
- **Docker** — для MongoDB в dev (`docker compose`); на Windows Docker Desktop должен быть **запущен** до `npm run dev`
- **Ollama** — локальный провайдер по умолчанию (`LLM_PROVIDER=ollama`), модель: `ollama pull qwen2.5vl:7b`. Альтернативы: `openai`, `google`, `grok` (нужен `LLM_API_KEY`)
- **@llm/linting** — workspace-пакет в `packages/linting` (см. [README](packages/linting/README.md))

## Установка

```bash
npm install
```

## Команды (из корня monorepo)

| Команда | Описание |
|---------|----------|
| `npm run dev` | Docker MongoDB + backend (`:3001`) + frontend (`:5173`); требует доступный Docker daemon |
| `npm run dev:mongo` | Только MongoDB через Docker Compose |
| `npm run dev:apps` | Backend + frontend без Docker (MongoDB должна быть уже запущена); обходной путь, если Docker недоступен |
| `npm run lint` | ESLint во всех workspaces |
| `npm test` | Unit-тесты web (Vitest): ветки ≥ 80%, без красных непокрытых строк |
| `npm run build` | Сборка web + api |
| `npm run storybook` | Storybook web (`:6006`); стори компонентов — `components/Name/__stories__/` |

## Переменные окружения

Единый файл в корне репозитория:

```bash
cp .env.example .env
```

| Сервис | Переменная | Default |
|--------|------------|---------|
| API | `PORT` | `3001` |
| API | `MONGODB_URI` | `mongodb://localhost:27017/plant_care` |
| API | `LLM_PROVIDER` | `ollama` (`ollama`, `openai`, `google`, `grok` — файл `services/<имя>.client.ts`) |
| API | `LLM_TIMEOUT_MS` | `120000` |
| API | `LLM_API_KEY` | — (для Ollama не нужен) |
| API | `LLM_MODEL` | `qwen2.5vl:7b` в `.env.example` |
| API | `LLM_BASE_URL` | `http://localhost:11434` в `.env.example` |
| API | `WEATHER_DEFAULT_CITY` | `Москва` |
| Web | `WEB_PORT` | `5173` |
| Web | `VITE_API_BASE_URL` | `http://localhost:3001` |
| Docker | `MONGO_PORT` | `27017` |

При смене `MONGO_PORT` обновите также порт в `MONGODB_URI`. Локальные `apps/*/.env` по-прежнему поддерживаются как override поверх корневого `.env`.

## Структура

```
apps/web/        — Vite + React + Ant Design (см. apps/web/src ниже)
apps/api/        — Express + MongoDB
packages/linting — @llm/linting (ESLint + Prettier)
docs/            — CONSTITUTION, MVP_PLAN, AGENT_PIPELINE
```

`apps/web/src` (соглашения: стрелочные функции, импорты — [Frontend в CONSTITUTION](docs/CONSTITUTION.md#frontend-структура-и-соглашения)):

```
pages/       — CatalogPage, AddPage, EditPlantPage (+ index.ts); типы — `PageName.types.ts`
components/  — AppLayout, RetryAlert, WeatherWidget, catalog/*, plant/* (+ index.ts); утилиты — `ComponentName.utils.ts`, типы — `ComponentName.types.ts`, стили — `ComponentName.css` рядом с компонентом; стори — `__stories__/ComponentName.stories.tsx` (обязательны для каждого компонента); тесты — `__tests__/ComponentName.test.tsx`; без `@api` (включая `ApiError`) — колбэки, готовые URL и `Error.message` снаружи (`pages/`, `hooks/`, `containers/`)
containers/  — WeatherWidgetContainer (+ index.ts); алиас `@containers`
api/         — ApiClient, PlantsApi
hooks/       — usePlantsCatalog, useWeather
types/       — модель растения, погода
App.tsx      — маршруты /, /add, /plants/:id/edit; WeatherProvider; `headerExtra` в AppLayout
```

## API (этап 2)

Проверка LLM (провайдер из `LLM_PROVIDER`):

```bash
curl http://localhost:3001/api/health/llm
```

Распознавание растения по фото (нужны запущенные API и настроенный провайдер из `LLM_PROVIDER`; для Ollama — модель `qwen2.5vl:7b` из `.env.example`):

```bash
curl -X POST http://localhost:3001/api/plants/recognize \
  -F "image=@/path/to/plant.jpg"
```

Оценка состояния растения по фото:

```bash
# загруженный файл (форма добавления / новое фото при редактировании)
curl -X POST http://localhost:3001/api/plants/assess-condition \
  -F "image=@/path/to/plant.jpg"

# сохранённое растение — оригинал из GridFS
curl -X POST http://localhost:3001/api/plants/<plant-id>/assess-condition
```

## Документация

- `docs/CONSTITUTION.md` — стек, архитектура, структура frontend, формулы, лимиты
- `docs/MVP_PLAN.md` — чеклист этапов 0–6 (**MVP закрыт**)
- `docs/AGENT_PIPELINE.md` — контракт пайплайна агентов
