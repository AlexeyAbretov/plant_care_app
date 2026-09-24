# Конституция проекта «Контроль ухода за растениями»

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React, TypeScript, Vite, Ant Design (`ru_RU`), React Router |
| Backend | Node.js ≥ 22, TypeScript, Express |
| База данных | MongoDB (dev — Docker Compose) |
| Файлы изображений | MongoDB GridFS |
| LLM | Ollama, ChatGPT, Gemma или Grok (`LLM_PROVIDER`, server-side, без выбора в UI) |
| Lint | ESLint 9 + Prettier, правила Cursor и шаблон frontend — `@llm/linting` (`packages/linting`) |

## Архитектура

```
Браузер (React SPA)
    ↓ REST API
Backend (Express)
    ↓                    ↓
MongoDB (+ GridFS)    Ollama, ChatGPT, Gemma или Grok
```

- Frontend обращается только к backend REST API.
- Распознавание изображений выполняется на backend через клиент `services/<LLM_PROVIDER>.client.ts`.
- Изображения растений хранятся в GridFS; метаданные — в коллекциях MongoDB.

## Frontend: структура и соглашения

Исходники SPA — `apps/web/src`. Слои и назначение:

| Каталог | Назначение |
|---------|------------|
| `pages/` | Экраны маршрутов: каталог, добавление, редактирование |
| `components/` | Переиспользуемый UI, папка на компонент (`AppLayout`, `PlantCard`, `WeatherWidget`, …) |
| `containers/` | Контейнеры: данные и хуки, без собственной вёрстки (`WeatherWidgetContainer`) |
| `api/` | HTTP-клиент (`ApiClient.ts`) и REST (`PlantsApi.ts`) |
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
│   ├── PlantCard/
│   ├── PlantForm/
│   ├── WeatherWidget/
│   └── …                 # папка на компонент, вход — её index.ts
├── containers/
│   ├── index.ts          # публичный баррель контейнеров
│   └── WeatherWidgetContainer/
├── hooks/
├── pages/
│   ├── index.ts
│   ├── CatalogPage/
│   ├── AddPage/
│   └── EditPlantPage/
├── types/
└── utils/
    ├── index.ts          # баррель @utils
    └── date.ts           # Date и Intl
```

**Маршруты** (`App.tsx`, React Router):

| Путь | Страница |
|------|----------|
| `/` | `CatalogPage` |
| `/add` | `AddPage` |
| `/plants/:id/edit` | `EditPlantPage` |

Оболочка — `AppLayout`; локаль Ant Design — `ru_RU`.

**Зависимости:**

Не добавляй npm-пакет, если ту же задачу закрывает стандартная библиотека JavaScript (`Date`, `Intl`, `URL`, `fetch` и т. п.). Даты формы — строка `YYYY-MM-DD`, арифметика в `src/utils/date.ts` (баррель `@utils`). Локаль Ant Design — `ConfigProvider locale={ruRU}`. `dayjs` только у `DatePicker`, см. шаблон frontend.

**Соглашения UI** (стрелки, алиасы, контейнеры, запрет API в `components/`, колокация `Name.utils.ts` / `Name.types.ts` / `Name.css`, Storybook, Vitest) — в [`packages/linting/docs/frontend.md`](../packages/linting/docs/frontend.md). Ниже — только этот проект.

**Этот проект:**

Алиасы объявлены в `tsconfig.app.json` и `vite.config.ts`.

- Страницы забирают из барреля `PlantForm.utils.ts` (`mapFormValuesToPayload`, `mapPlantToFormValues`) и тип `PlantFormValues`. `CareProgressBar.utils.ts` остаётся внутри компонента. `WeatherTriggerProps` лежит в `WeatherWidget.types.ts`. Модели `Plant` и `WeatherSnapshot` — в `src/types/`.
- `WeatherWidgetContainer` передаётся в `AppLayout` пропом `headerExtra` (`App.tsx`). Погода одна на приложение (`WeatherProvider`).

**Тесты этого репозитория:**

Подготовка — `apps/web/src/test/setup.ts` (календарная дата зафиксирована на 2026-09-22, сериализатор снапшотов стабилизирует id и классы анимации Ant Design). Рендер с локалью `ru_RU` и роутером — `renderUi` из `apps/web/src/test/render.tsx`. Пороги покрытия и раскладка `__tests__` — в шаблоне frontend. Жёлтым могут оставаться частично покрытые ветки (`apps/web/vite.config.ts`). Режим наблюдения: `npm run test:watch -w @plant-care/web`. В режиме `test` `VITE_API_BASE_URL` фиксируется как `http://localhost:3001`.

Прогресс полива/подкормки в UI считается в `components/CareProgressBar/CareProgressBar.utils.ts` по тем же правилам, что в разделе «Прогресс-бар ухода» ниже. Для полива в каталоге в `intervalDays` подставляется **эффективный** интервал (см. «Полив и погода»).

## Границы MVP

MVP **закрыт**: этапы 0–6 выполнены, см. [MVP_PLAN.md](MVP_PLAN.md).

**В scope:**

- UI только на русском языке
- Загрузка фото, генерация превью 128×128
- Распознавание через настроенную LLM (Ollama, ChatGPT, Gemma или Grok): название, описание, параметры, уход, категория
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
- Выбор провайдера и модели LLM в UI

## Переменные окружения

Dev-окружение настраивается **одним** файлом `.env` в корне репозитория (шаблон — `.env.example`).

### Backend (`apps/api`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `3001` | Порт HTTP API |
| `MONGODB_URI` | `mongodb://localhost:27017/plant_care` | Строка подключения MongoDB |
| `LLM_PROVIDER` | `ollama` | Клиент `services/<имя>.client.ts`: `ollama`, `openai`, `google`, `grok` |
| `LLM_TIMEOUT_MS` | `120000` | Таймаут запроса к модели |
| `LLM_API_KEY` | — | Ключ облачной модели. Для Ollama не нужен |
| `LLM_MODEL` | — | Имя модели. В `.env.example` для Ollama: `qwen2.5vl:7b` |
| `LLM_BASE_URL` | — | Базовый URL. В `.env.example` для Ollama: `http://localhost:11434` |
| `WEATHER_DEFAULT_CITY` | `Москва` | Город по умолчанию для прогноза |

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

где `daysSince` — число дней с последнего полива (или подкормки), `intervalDays` — интервал в днях (для полива — эффективный, с учётом погоды).

Цвета:

| Условие | Цвет |
|---------|------|
| progress > 75% | зелёный |
| 50% < progress ≤ 75% | жёлтый |
| 25% < progress ≤ 50% | оранжевый |
| 0 < progress ≤ 25% | красный |
| progress = 0% | красный (заливка и фон полосы) |
| просрочено | красный |

## Полив и погода

Интервал в БД (`wateringIntervalDays`) **не переписывается**. Каталог считает эффективный интервал на лету.

`locationKind`: `indoor` (в помещении, по умолчанию) или `outdoor` (улица / балкон). Существующие растения без поля читаются как `indoor`.

Снимок погоды (`GET /api/weather`) включает `wateringClimate`:

Флаги считаются по прогнозу на **7 дней**, не по текущей погоде.
Флаг включён, если условие выполняется у большинства дней
(не меньше половины, для 7 дней — 4).

| Флаг | Правило |
|------|---------|
| `heatingSeason` | среднесуточная ≤ **+8 °C** |
| `heat` | максимум дня ≥ **+26 °C** |
| `overcast` | нет солнца: облачно, туман, морось, дождь, снег, гроза |
| `precipitationLikely` | вероятность осадков ≥ **60%** или дождь / морось / гроза / снег |

Коэффициенты (перемножаются, затем clamp **0.5…1.5**):

| Условие | Коэффициент |
|---------|-------------|
| `indoor` и отопительный сезон | ×0.7 |
| жара | ×0.85 |
| мало солнца без жары и вне отопительного сезона | ×1.15 |
| `outdoor` и осадки | ×1.3 |

```
effectiveDays = clamp(
  round(base × Π factors),
  max(1, round(base × 0.5)),
  round(base × 1.5)
)
```

Дождь входит в «мало солнца» и удлиняет полив и комнатным. Отдельный
коэффициент осадков — только у уличных. Отопление не укорачивает интервал
уличных. Мало солнца не применяется в жару и в отопительный сезон; уличным
при осадках оно не складывается с дождём.

Сортировка каталога по поливу и подпись на карточке («через 2 дня · отопление…») используют `effectiveDays`. Погода одна на приложение (`WeatherProvider` в `App.tsx`).

## Изображения

- Максимальный размер загружаемого файла: **5 МБ**
- Превью для каталога: **128×128** px
- Хранение: **GridFS** в MongoDB
