# План: локальный редактор контента

Статус: предложение к ревью. Шаг 0 выполнен, дальше — по одному шагу с ревью.

## Задача

Форма вместо YAML и CLI. Запуск `pnpm editor` → открывается браузер на
`127.0.0.1` → заполнил поля → файлы записались на диск → коммит вручную.

## Границы

Сайт не трогаем. Он остаётся статикой на GitHub Pages, загрузчики на
`import.meta.glob`, деплой через `deploy.yml`. Редактор — отдельный пакет в
монорепо, в сборку сайта не попадает. Типы контента: `post`, `article`,
`project`.

## Решения

| Вопрос              | Решение                                                |
| ------------------- | ------------------------------------------------------ |
| Где работает        | локально, `pnpm editor`, только `127.0.0.1`            |
| Коммит              | руками, редактор только пишет файлы                    |
| Языки               | две вкладки RU/EN, обе обязательны                     |
| Создание EN         | кнопка «Скопировать из RU» + `needs_translation: true` |
| Weekly              | не входит в план                                       |
| Баннер              | ровно 1200×630, `cover`, кроп по центру                |
| Контентная картинка | ширина до 1200, высота свободна, `inside`              |
| Удаление контента   | нужна кнопка Delete                                    |
| `needs_translation` | оставить, имя правильное                               |

## Стек

| Пакет                   | Технологии                                    |
| ----------------------- | --------------------------------------------- |
| `web-site/`             | как сейчас, не трогаем                        |
| `packages/content-core` | TypeScript, `js-yaml`                         |
| `packages/editor`       | SvelteKit + `adapter-node`, Svelte 5, `sharp` |

SvelteKit для редактора, а не голый Vite: `hooks.server.ts` даёт проверку
доступа на каждом запросе в одном месте, плюс привычные роуты для глубоких
ссылок вида `/project/brul`. У пакета своя `svelte.config.js`.

## Порядок

```txt
0 baseline                     ✓ выполнен
1 каркас монорепо
2 content-core
3 перевести lint-content.ts на content-core
4 каркас редактора + доступ
5 API контента
6 форма
7 картинки
8 документация
```

После каждого шага: `pnpm build` сайта, `pnpm check`, `pnpm lint`.

---

### Шаг 0. Зафиксировать baseline

Прогнать `pnpm verify` и `pnpm test:e2e`. Выполнен 2026-09-30, обе команды
зелёные. Правки, которые для этого понадобились, — в истории git.

### Шаг 1. Каркас монорепо

#### 1.1 Файлы

- `pnpm-workspace.yaml` — добавить `packages: - "packages/*"`
- `packages/content-core/package.json` + `tsconfig.json`
- `packages/editor/package.json` + `tsconfig.json` + `svelte.config.js` +
  `vite.config.ts`
- `package.json` (корень) — скрипт `editor`

#### 1.2 Решения

- корень репозитория резолвится от расположения пакета вверх до
  `pnpm-workspace.yaml`, а не от `process.cwd()` — иначе сломается при запуске
  из другой папки
- editor: `host: "127.0.0.1"`, порт `4321`
- добавить `sharp`; если pnpm заблокирует установку —
  `onlyBuiltDependencies: ["sharp"]` в `pnpm-workspace.yaml`

Проверка: `pnpm install` без ошибок, `pnpm build` сайта работает.

### Шаг 2. `content-core` — чтение и запись

#### 2.1 Файлы

```txt
packages/content-core/src/
  types.ts        ContentType, Lang, ContentUnit
  fields.ts       описания полей по типам
  paths.ts        корень репозитория, пути content/static
  yaml.ts         split/serialize frontmatter, кавычки по необходимости
  repository.ts   list / read / write / delete единиц
  index.ts
```

#### 2.2 Что важно

- сериализация обязана давать тот же формат, что сегодня `new-content.ts` и
  `gen-mocks.ts`, иначе prettier будет переписывать файлы при каждом сохранении
- типы полей в `fields.ts`: `string`, `text`, `boolean`, `string[]`, `date`,
  `url`, `markdown`
- `fields.ts` и `frontmatter.json` (нужен расширению Frontmatter CMS) обязаны
  совпадать → тест сравнения, иначе схемы разъедутся

Проверка: `pnpm test:run` — тесты на round-trip чтения/записи и на совпадение
схем.

### Шаг 3. Перевести `lint-content.ts` на `content-core`

#### 3.1 Зачем

Доказать, что общая валидация эквивалентна сегодняшней, **до** того как редактор
начнёт на неё опираться.

Вынести правила из `scripts/lint-content.ts` в `content-core/src/validate.ts`,
скрипт оставить тонкой обёрткой.

Проверка: вывод `pnpm lint:content` до и после идентичен. Расхождение — повод
разобраться, а не починить молча.

### Шаг 4. Каркас редактора и доступ

#### 4.1 Файлы

```txt
packages/editor/src/
  hooks.server.ts              проверка доступа на каждый запрос
  lib/server/auth.ts           токен: генерация, выдача, сверка
  routes/+layout.svelte
  routes/+page.svelte          список единиц
  routes/api/units/+server.ts  GET список
```

#### 4.2 Поведение

- при старте генерируется токен, печатается в консоль, открывается ссылка с ним
  в query
- `GET /` без валидного токена → 401
- запрос с чужим `Host` → 403
- сервер слушает только `127.0.0.1`

Проверка: `pnpm editor` открывает форму; `curl` без токена → 401;
`curl -H "Host: evil.com"` → 403; `netstat` показывает только 127.0.0.1.

### Шаг 5. API контента

| Метод  | Путь                              | Действие                                      |
| ------ | --------------------------------- | --------------------------------------------- |
| GET    | `/api/units?type=`                | список: slug, есть ru/en, `needs_translation` |
| GET    | `/api/units/[type]/[slug]`        | оба языка                                     |
| POST   | `/api/units/[type]/[slug]/[lang]` | создать                                       |
| PUT    | `/api/units/[type]/[slug]/[lang]` | сохранить                                     |
| DELETE | `/api/units/[type]/[slug]`        | удалить оба файла                             |

Сохранение возвращает результат валидации из `content-core`.

Проверка: `pnpm lint:content` после правок через API даёт то же, что ручная
правка файлов.

### Шаг 6. Форма

#### 6.1 Файлы

```txt
packages/editor/src/lib/components/
  UnitForm.svelte        вкладки RU/EN, поля, сохранение
  Field.svelte           рендер по типу из fields.ts
  MarkdownField.svelte   textarea
  ValidationPanel.svelte ошибки и предупреждения
```

#### 6.2 Поведение

- вкладки RU / EN, обе обязательны
- «Скопировать из RU» — создаёт `index.en.md` из `index.ru.md`, ставит
  `needs_translation: true`, тело EN = «перевод в работе.»
- slug валидируется при вводе; **после создания меняется с подтверждением** —
  переименование ломает старые ссылки
- `draft` — переключатель
- для `article` видно, где `<!--more-->`, есть кнопка вставить
- валидация показывается после каждого сохранения; сохранение не блокируется
  (кроме битого YAML), чтобы можно было дописывать постепенно

#### 6.3 Пути к картинкам в markdown

Картинки внутри markdown сейчас ломаются: `![alt](images/x.jpg)` на странице
`/ru/posts/slug/` превращается в `/ru/posts/slug/images/x.jpg` → 404, потому что
`vite-plugin-svelte-md` пути не переписывает. Вставка в тело генерирует
абсолютный путь `/images/...`.

Проверка: создать единицу всех трёх типов, заполнить, сохранить, открыть
`pnpm dev` и посмотреть на сайте.

### Шаг 7. Картинки

#### 7.1 Файлы

```txt
packages/editor/src/lib/server/images.ts
packages/editor/src/routes/api/images/+server.ts
packages/editor/src/lib/components/ImageDrop.svelte
```

#### 7.2 Конвейер

```ts
sharp(buffer)
  .rotate() // учесть EXIF
  // баннер:  .resize(1200, 630, { fit: "cover", position: "centre" })
  // контент: .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 82 });
```

- имя `<slug>-<8 hex>.webp`, чтобы не перетирать
- GIF не трогаем, анимация теряется
- результат — абсолютный путь `/images/<file>.webp`
- при замене обложки предыдущий файл удаляется

Проверка: загрузить картинку 3000×2000 в поле обложки → на диске 1200×630; в
текст статьи → ширина 1200, высота по пропорции; в `pnpm dev` картинка видна.

### Шаг 8. Документация

- `docs/writing.md` — переписать вокруг редактора
- `AGENTS.md` — добавить `pnpm editor` в раздел Content
- решить судьбу CLI `npm run new`: оставить как инструмент для скриптов и
  агентов, или удалить
