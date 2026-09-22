# Контроль ухода за растениями

Monorepo для учёта домашних растений: загрузка фото, распознавание через LLM, каталог с индикаторами полива и подкормки.

**MVP закрыт** (этапы 0–6). План и чеклист — [docs/MVP_PLAN.md](docs/MVP_PLAN.md).

## Стек

- **Frontend:** React, TypeScript, Vite, Ant Design (`ru_RU`)
- **Backend:** Node.js, TypeScript, Express
- **БД:** MongoDB (+ GridFS для изображений)
- **LLM:** провайдер из `LLM_PROVIDER` (`ollama`, `openai`, `google`, `grok`). По умолчанию Ollama `qwen2.5vl:7b`

## Требования

- Node.js ≥ 22
- Docker (MongoDB в dev); на **Windows** перед `npm run dev` запустите **Docker Desktop** и дождитесь статуса Ready
- Ollama — локальный провайдер по умолчанию (`LLM_PROVIDER=ollama`):

```bash
ollama pull qwen2.5vl:7b
```

Облачные провайдеры (`openai`, `google`, `grok`) задаются тем же `LLM_PROVIDER` и переменными `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.

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

1. MongoDB (`docker compose up -d`, порт `MONGO_PORT`, по умолчанию `27017`)
2. Backend API (порт `PORT`, по умолчанию `http://localhost:3001`)
3. Frontend (порт `WEB_PORT`, по умолчанию `http://localhost:5173`)

Если Docker недоступен (не установлен, daemon не запущен или Docker Desktop на Windows выключен) — запустите MongoDB отдельно и используйте:

```bash
npm run dev:apps
```

Команда `npm run dev` при недоступном Docker завершится с понятным сообщением и подсказкой про `dev:apps`.

### Health check

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

## Переменные окружения

Единый файл в корне репозитория:

```bash
cp .env.example .env
```

| Переменная | Сервис | По умолчанию |
|------------|--------|--------------|
| `PORT` | API | `3001` |
| `WEB_PORT` | Web (Vite dev) | `5173` |
| `MONGO_PORT` | Docker MongoDB | `27017` |
| `MONGODB_URI` | API | `mongodb://localhost:27017/plant_care` |
| `LLM_PROVIDER` | API | `ollama` (`ollama`, `openai`, `google`, `grok` — файл `services/<имя>.client.ts`) |
| `LLM_TIMEOUT_MS` | API | `120000` |
| `LLM_API_KEY` | API | — (для Ollama не нужен) |
| `LLM_MODEL` | API | `qwen2.5vl:7b` в `.env.example` |
| `LLM_BASE_URL` | API | `http://localhost:11434` в `.env.example` |
| `WEATHER_DEFAULT_CITY` | API | `Москва` |
| `VITE_API_BASE_URL` | Web | `http://localhost:3001` |

При смене `MONGO_PORT` обновите также порт в `MONGODB_URI`.

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

Подробнее — в [docs/CONSTITUTION.md](docs/CONSTITUTION.md) (в т. ч. [структура frontend](docs/CONSTITUTION.md#frontend-структура-и-соглашения)).
