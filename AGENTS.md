# Инструкции для агентов

## Требования

- **Node.js** ≥ 22
- **Docker** — для MongoDB в dev (`docker compose`)
- **Ollama** — локально, модель: `ollama pull qwen3-vl:8b`
- **@llm/linting** — соседний каталог `../linting` (см. [архив linting](https://github.com/user-attachments/files/32196662/linting.zip))

## Установка

```bash
# Распаковать linting.zip в каталог ../linting относительно корня репозитория
npm install
```

## Команды (из корня monorepo)

| Команда | Описание |
|---------|----------|
| `npm run dev` | Docker MongoDB + backend (`:3001`) + frontend (`:5173`) |
| `npm run dev:mongo` | Только MongoDB через Docker Compose |
| `npm run dev:apps` | Backend + frontend без Docker (MongoDB должна быть уже запущена) |
| `npm run lint` | ESLint во всех workspaces |
| `npm run build` | Сборка web + api |

## Переменные окружения

Скопировать примеры:

```bash
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

| Сервис | Переменная | Default |
|--------|------------|---------|
| API | `MONGODB_URI` | `mongodb://localhost:27017/plant_care` |
| API | `OLLAMA_BASE_URL` | `http://localhost:11434` |
| API | `OLLAMA_TIMEOUT_MS` | `120000` |
| API | `PORT` | `3001` |
| Web | `VITE_API_BASE_URL` | `http://localhost:3001` |

## Структура

```
apps/web/   — Vite + React + Ant Design
apps/api/   — Express + MongoDB
docs/       — CONSTITUTION, MVP_PLAN, AGENT_PIPELINE
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

## Документация

- `docs/CONSTITUTION.md` — стек, архитектура, формулы, лимиты
- `docs/MVP_PLAN.md` — чеклист этапов 0–5
- `docs/AGENT_PIPELINE.md` — контракт пайплайна агентов
