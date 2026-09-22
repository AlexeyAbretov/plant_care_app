# Конституция проекта «Контроль ухода за растениями»

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React, TypeScript, Vite, Ant Design (`ru_RU`), React Router |
| Backend | Node.js ≥ 22, TypeScript, Express |
| База данных | MongoDB (dev — Docker Compose) |
| Файлы изображений | MongoDB GridFS |
| LLM | Ollama, ChatGPT или Gemma (`LLM_PROVIDER`, server-side, без выбора в UI) |
| Lint | ESLint 9 + Prettier через `@llm/linting` (in-repo, `packages/linting`) |

## Архитектура

```
Браузер (React SPA)
    ↓ REST API
Backend (Express)
    ↓                    ↓
MongoDB (+ GridFS)    Ollama, ChatGPT или Gemma
```

- Frontend обращается только к backend REST API.
- Распознавание изображений выполняется на backend через клиент `services/<LLM_PROVIDER>.client.ts`.
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

Не добавляй npm-пакет, если ту же задачу закрывает стандартная библиотека JavaScript (`Date`, `Intl`, `URL`, `fetch` и т. п.). Календарная арифметика и даты формы — через `Date` и `Intl` (`src/utils/date.ts`, баррель `@utils`), в форме дата хранится строкой `YYYY-MM-DD`. Локаль интерфейса, включая `DatePicker`, задаёт `ConfigProvider locale={ruRU}`. `dayjs` не импортировать в страницах и стори: у `DatePicker` Ant Design значение внутри — `Dayjs`, перевод в строку живёт рядом с полем. Пакет ставит `antd`.

**Функции:**

Именованные и экспортируемые функции — стрелочные (`export const PlantCard = () => {}`), не `function declaration`. Вложенные обработчики — `const handleX = async () => {}`. Методы классов в `api/` (`ApiClient`, `PlantsApi`) остаются методами. Линтер: `func-style: expression` в `apps/web/eslint.config.js` поверх `@llm/linting` (там для API по умолчанию `function`).

**Импорты:**

Алиасы (`tsconfig.app.json`, `vite.config.ts`): `@api`, `@components`, `@config`, `@containers`, `@hooks`, `@pages`, `@types`, `@utils` → соответствующие каталоги (или `config.ts`) в `src/`.

- Между корневыми каталогами `src` — только алиасы, не `../../api` и не `./components`.
- Внутри одной папки/фичи — относительные `./` и `../` (соседи в `plant/`, `catalog/` и т. п.).
- Страницы и код вне `components/plant/**` и `components/catalog/**` импортируют UI только из барреля `@components`, а не из подпутей `plant/` и `catalog/` (ESLint `no-restricted-imports` в `apps/web/eslint.config.js`).
- Контейнеры — из барреля `@containers`, не из подпутей `containers/`.
- Реэкспорт доменов — через `components/index.ts`; контейнеры — `containers/index.ts`; страницы маршрутов — баррель `@pages`.
- Относительные импорты **без** суффикса `.js` (отдельное ограничение ESLint для web).

**Контейнеры:**

Папка и баррель — как у компонентов: `containers/Name/Name.tsx` + `index.ts`, публичный реэкспорт через `containers/index.ts`.

Контейнер подключает хуки и передаёт пропсы в UI-компонент. `AppLayout` не знает про конкретные контейнеры: слот хеадера — проп `headerExtra` (см. `App.tsx`).

**Компоненты не вызывают API:**

Каталог `components/` не обращается к backend, не собирает его URL и не импортирует `@api`, включая `ApiError`. Вызовы REST, `apiClient.url` и разбор `ApiError` живут в `pages/`, `hooks/` и `containers/`. Компонент получает результат снаружи:

- действие — колбэк (`onWater`, `onDelete`, `onAssess`);
- адрес картинки — готовая строка (`imageSrc`, `previewSrc`);
- текст сбоя колбэка — `Error.message`, иначе своя заглушка компонента.

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

**Стори (Storybook):**

У каждого компонента в `components/` есть стори. Файл лежит в каталоге `__stories__` этой папки: `ComponentName/__stories__/ComponentName.stories.tsx` (пример: `PlantCard/__stories__/PlantCard.stories.tsx`).

- Импорт компонента — относительный (`../ComponentName`). В баррель (`index.ts`, `@components`) стори не реэкспортируют.
- Формат CSF3: `satisfies Meta<typeof Component>`, каждая стори — именованный экспорт. `title` — `Components/ComponentName`, чтобы каталог `__stories__` не попадал в сайдбар.
- Минимум одна стори. Отличимые состояния UI — отдельные стори.
- Общие провайдеры (локаль Ant Design, роутер) задаются в `apps/web/.storybook/preview.tsx`.
- Запуск из корня: `npm run storybook` (порт `6006`).

**Unit-тесты (Vitest):**

Тесты лежат в подпапке `__tests__` того артефакта, который проверяют: `PlantCard/__tests__/PlantCard.test.tsx`, `api/PlantsApi/__tests__/PlantsApi.test.ts`, `utils/__tests__/date.test.ts`. В баррель тесты не реэкспортируют. Импорт проверяемого модуля — относительный, как в стори.

- Раннер — Vitest (`jsdom`), запросы к DOM — Testing Library. Общая подготовка — `apps/web/src/test/setup.ts` (календарная дата зафиксирована на 2026-09-22, сериализатор снапшотов стабилизирует id и классы анимации Ant Design). Рендер с локалью `ru_RU` и роутером — `renderUi` из `apps/web/src/test/render.tsx`.
- Отображение компонентов, контейнеров и страниц проверяется снапшотами (`toMatchSnapshot`). Клиенты API, хуки и утилиты — утверждениями на вызовы и возвращаемые значения.
- В покрытие входят `src/api`, `src/components`, `src/containers`, `src/hooks`, `src/pages`, `src/utils`. Не входят `*.types.ts`, баррели `index.ts`, `__stories__` и `__tests__`. Порог веток — 80%. Строки, операторы и функции — 100%: в HTML-отчёте не должно оставаться красных непокрытых строк. Жёлтым могут оставаться частично покрытые ветки (`apps/web/vite.config.ts`).
- Из корня: `npm test`. Режим наблюдения: `npm run test:watch -w @plant-care/web`. В режиме `test` `VITE_API_BASE_URL` фиксируется как `http://localhost:3001`.

Каталог `src/utils/` — для кода с несколькими независимыми потребителями вне одного компонента. Календарные даты — `utils/date.ts`.

Прогресс полива/подкормки в UI считается в `components/CareProgressBar/CareProgressBar.utils.ts` по тем же правилам, что в разделе «Прогресс-бар ухода» ниже. Для полива в каталоге в `intervalDays` подставляется **эффективный** интервал (см. «Полив и погода»).

## Границы MVP

MVP **закрыт**: этапы 0–6 выполнены, см. [MVP_PLAN.md](MVP_PLAN.md).

**В scope:**

- UI только на русском языке
- Загрузка фото, генерация превью 128×128
- Распознавание через настроенную LLM (Ollama или ChatGPT): название, описание, параметры, уход, категория
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
| `LLM_PROVIDER` | `ollama` | Имя клиента: `services/<имя>.client.ts` |
| `LLM_TIMEOUT_MS` | `120000` | Таймаут запроса к модели |
| `LLM_API_KEY` | — | Ключ облачной модели. Для Ollama не нужен |
| `LLM_MODEL` | — | Имя модели |
| `LLM_BASE_URL` | — | Базовый URL модели |

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
