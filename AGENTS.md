# Инструкции для агентов

## Требования

- **Node.js** ≥ 22
- **Docker** — для MongoDB в dev (`docker compose`); на Windows Docker Desktop должен быть **запущен** до `npm run dev`
- **Ollama** — локальный провайдер по умолчанию (`LLM_PROVIDER=ollama`), модель: `ollama pull qwen2.5vl:7b`. Альтернативы: `openai`, `google`, `grok` (нужен `LLM_API_KEY`)
- **@llm/linting** — общий ESLint, Prettier, правила Cursor и шаблон frontend (`packages/linting`, см. [README](packages/linting/README.md))

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
| `npm run sync-cursor` | Копирует `packages/linting/cursor/` в `.cursor/rules/`. Правила только этого репозитория не затирает |

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
packages/linting — @llm/linting (ESLint, Prettier, правила Cursor, шаблон frontend)
docs/            — CONSTITUTION, MVP_PLAN
```

`apps/web/src` — дерево и доменные правила: [Frontend в CONSTITUTION](docs/CONSTITUTION.md#frontend-структура-и-соглашения). Общий шаблон слоёв, стори и тестов: [frontend.md](packages/linting/docs/frontend.md).

```
pages/       — CatalogPage, AddPage, EditPlantPage
components/  — папка на компонент (AppLayout, PlantCard, WeatherWidget, …)
containers/  — WeatherWidgetContainer
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

- `docs/CONSTITUTION.md` — стек, архитектура, дерево frontend, формулы, лимиты
- `packages/linting/docs/frontend.md` — переносимый шаблон UI (слои, стори, тесты)
- `docs/MVP_PLAN.md` — чеклист этапов 0–6 (**MVP закрыт**)
