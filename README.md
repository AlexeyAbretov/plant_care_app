# Контроль ухода за растениями

Monorepo для учёта домашних растений: загрузка фото, распознавание через Ollama, каталог с индикаторами полива и подкормки.

## Стек

- **Frontend:** React, TypeScript, Vite, Ant Design (`ru_RU`)
- **Backend:** Node.js, TypeScript, Express
- **БД:** MongoDB (+ GridFS для изображений)
- **LLM:** Ollama `qwen3-vl:8b`

## Требования

- Node.js ≥ 22
- Docker (MongoDB в dev)
- Ollama с моделью vision:

```bash
ollama pull qwen3-vl:8b
```

## Установка

```bash
git clone <repo-url>
cd plant_care_app
npm install
```

## Запуск (dev)

```bash
npm run dev
```

Команда поднимает:

1. MongoDB (`docker compose up -d`, порт `27017`)
2. Backend API (`http://localhost:3001`)
3. Frontend (`http://localhost:5173`)

Если Docker недоступен — запустите MongoDB отдельно и используйте:

```bash
npm run dev:apps
```

### Health check

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

## Переменные окружения

```bash
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

| Переменная | Сервис | По умолчанию |
|------------|--------|--------------|
| `MONGODB_URI` | API | `mongodb://localhost:27017/plant_care` |
| `OLLAMA_BASE_URL` | API | `http://localhost:11434` |
| `PORT` | API | `3001` |
| `VITE_API_BASE_URL` | Web | `http://localhost:3001` |

## Lint и сборка

```bash
npm run lint
npm run build
```

## Структура

```
plant_care_app/
├── apps/
│   ├── web/          # Frontend (Vite + React)
│   └── api/          # Backend (Express)
├── packages/
│   └── linting/      # @llm/linting (ESLint + Prettier)
├── docs/
│   ├── CONSTITUTION.md
│   ├── MVP_PLAN.md
│   └── AGENT_PIPELINE.md
├── docker-compose.yml
└── AGENTS.md
```

Подробнее — в [docs/CONSTITUTION.md](docs/CONSTITUTION.md).
