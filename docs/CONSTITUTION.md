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
│   ├── RetryAlert/
│   ├── WeatherWidget/
│   ├── catalog/          # PlantCard, CatalogToolbar, CareProgressBar
│   └── plant/            # PlantForm, ImageUpload, ConditionButton, …
├── containers/
│   ├── index.ts          # публичный баррель контейнеров
│   └── WeatherWidgetContainer/
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

**Функции:**

Именованные и экспортируемые функции — стрелочные (`export const PlantCard = () => {}`), не `function declaration`. Вложенные обработчики — `const handleX = async () => {}`. Методы классов в `api/` (`ApiClient`, `PlantsApi`) остаются методами. Линтер: `func-style: expression` в `apps/web/eslint.config.js` поверх `@llm/linting` (там для API по умолчанию `function`).

**Импорты:**

Алиасы (`tsconfig.app.json`, `vite.config.ts`): `@api`, `@components`, `@config`, `@containers`, `@hooks`, `@pages`, `@types` → соответствующие каталоги (или `config.ts`) в `src/`.

- Между корневыми каталогами `src` — только алиасы, не `../../api` и не `./components`.
- Внутри одной папки/фичи — относительные `./` и `../` (соседи в `plant/`, `catalog/` и т. п.).
- Страницы и код вне `components/plant/**` и `components/catalog/**` импортируют UI только из барреля `@components`, а не из подпутей `plant/` и `catalog/` (ESLint `no-restricted-imports` в `apps/web/eslint.config.js`).
- Контейнеры — из барреля `@containers`, не из подпутей `containers/`.
- Реэкспорт доменов — через `components/index.ts`; контейнеры — `containers/index.ts`; страницы маршрутов — баррель `@pages`.
- Относительные импорты **без** суффикса `.js` (отдельное ограничение ESLint для web).

**Контейнеры:**

Папка и баррель — как у компонентов: `containers/Name/Name.tsx` + `index.ts`, публичный реэкспорт через `containers/index.ts`.

Контейнер подключает хуки и передаёт пропсы в UI-компонент. `AppLayout` не знает про конкретные контейнеры: слот хеадера — проп `headerExtra` (см. `App.tsx`).

**Колокация утилит компонента:**

Чистые функции, которые относятся к одному компоненту, лежат в папке этого компонента файлом `ComponentName.utils.ts`.

- Если их вызывает только сам компонент — относительный импорт (`./ComponentName.utils`), в баррель не реэкспортируют. Пример: `CareProgressBar.utils.ts`.
- Если их вызывают страницы — реэкспорт через баррель компонента и `@components` (страницы не импортируют `plant/` / `catalog/` напрямую). Пример: `PlantForm.utils.ts` (`mapFormValuesToPayload`, `mapPlantToFormValues`).

**Колокация типов компонента и страницы:**

Пропсы и локальные типы лежат рядом файлом `Name.types.ts` (как utils и css).

- Внутри папки — относительный импорт (`./Name.types`). В баррель и `@components` реэкспортируют только типы, которые нужны снаружи (пример: `PlantFormValues`). Пропсы в баррель не выносят.
- Вложенные компоненты той же папки делят файл типов родителя (пример: `WeatherTriggerProps` в `WeatherWidget.types.ts`).
- Общие доменные модели (`Plant`, `WeatherSnapshot`) остаются в `src/types/` (`@types`).
- Пустой `.types.ts` не заводят.

Стили одного компонента — `ComponentName.css` рядом с ним (пример: `WeatherWidget.css`). Глобальный `index.css` — только сброс страницы (`body`, `#root`).

Каталог `src/utils/` заводят, когда появится код с несколькими независимыми потребителями вне одного компонента.

Прогресс полива/подкормки в UI считается в `components/CareProgressBar/CareProgressBar.utils.ts` по тем же правилам, что в разделе «Прогресс-бар ухода» ниже. Для полива в каталоге в `intervalDays` подставляется **эффективный** интервал (см. «Полив и погода»).

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

| Флаг | Правило |
|------|---------|
| `heatingSeason` | среди первых 4 дней прогноза ≥ 3 дней со среднесуточной ≤ **+8 °C** |
| `heat` | максимум сегодня или текущая температура ≥ **+26 °C** |
| `overcast` | сейчас или сегодня облачно / туман (`cloudy` / `fog`) |
| `precipitationLikely` | вероятность осадков сегодня ≥ **60%** или тип: дождь / морось / гроза / снег |

Коэффициенты (перемножаются, затем clamp **0.5…1.5**):

| Условие | Коэффициент |
|---------|-------------|
| `indoor` и отопительный сезон | ×0.7 |
| жара | ×0.85 |
| пасмурно без жары и вне отопительного сезона | ×1.15 |
| `outdoor` и осадки | ×1.3 |

```
effectiveDays = clamp(
  round(base × Π factors),
  max(1, round(base × 0.5)),
  round(base × 1.5)
)
```

Дождь не сдвигает полив комнатных. Отопление не укорачивает интервал уличных.
Пасмурно не применяется в жару и в отопительный сезон; уличным при осадках
не складывается с дождём.

Сортировка каталога по поливу и подпись на карточке («через 2 дня · отопление…») используют `effectiveDays`. Погода одна на приложение (`WeatherProvider` в `App.tsx`).

## Изображения

- Максимальный размер загружаемого файла: **5 МБ**
- Превью для каталога: **128×128** px
- Хранение: **GridFS** в MongoDB
