# Инструкции для агентов

## Требования

- **Node.js** ≥ 22
- **Docker** — для MongoDB в dev (`docker compose`); на Windows Docker Desktop должен быть **запущен** до `npm run dev`
- **Ollama** — локально, модель: `ollama pull qwen3-vl:8b`
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
| `npm run build` | Сборка web + api |

## Переменные окружения

Единый файл в корне репозитория:

```bash
cp .env.example .env
```

| Сервис | Переменная | Default |
|--------|------------|---------|
| API | `PORT` | `3001` |
| API | `MONGODB_URI` | `mongodb://localhost:27017/plant_care` |
| API | `OLLAMA_BASE_URL` | `http://localhost:11434` |
| API | `OLLAMA_TIMEOUT_MS` | `120000` |
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

`apps/web/src` (детали и соглашения импортов — [Frontend в CONSTITUTION](docs/CONSTITUTION.md#frontend-структура-и-соглашения)):

```
pages/       — CatalogPage, AddPage, EditPlantPage (+ index.ts)
components/  — AppLayout, RetryAlert, catalog/*, plant/* (+ index.ts); утилиты одного компонента — `ComponentName.utils.ts` рядом с ним
api/         — ApiClient, PlantsApi
hooks/       — usePlantsCatalog
types/       — модель растения
App.tsx      — маршруты /, /add, /plants/:id/edit
```

## API (этап 2)

Проверка Ollama:

```bash
curl http://localhost:3001/api/health/ollama
```

Распознавание растения по фото (нужны запущенные API и Ollama с моделью `qwen3-vl:8b`):

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
