# Процесс публикации контента

## Общая схема

```txt
src/content/<type>/<slug>/index.ru.md  →  prepare-post.ts  →  .post-meta.json  →  publish.ts  →  Telegram/Discord
                                                                                                            ↓
                                                                                          posts.yaml (ветка posts_db)
```

## Типы контента

| Тип     | Папка                   | Шаблон                            |
| ------- | ----------------------- | --------------------------------- |
| Статьи  | `src/content/articles/` | "Выложена новая статья: {title}…" |
| Посты   | `src/content/posts/`    | "Выложен новый пост: {title}…"    |
| Проекты | `src/content/projects/` | "Добавлен проект: {title}…"       |
| Итоги   | `src/content/weekly/`   | "Итоги недели…"                   |

Шаблоны и url-шаблоны хранятся в `scripts/templates.json`.

## Единица контента

Каждая единица — папка со своими языками:

```txt
src/content/posts/my-thought/
  index.ru.md        # основная версия — только она попадает в соцсети
  index.en.md        # перевод; в автопостинг никогда не попадает
```

- в соцсети уходит **только `index.ru.md`**: переводы (включая
  `needs_translation: true`) не публикуются никогда;
- черновики (`draft: true`) пропускаются;
- slug — имя папки, язык — суффикс имени файла (поле `lang` во frontmatter
  запрещено, см. `docs/writing.md`).

## Триггер

Workflow `publish.yml` запускается при пуше в `main`, если изменились файлы в
`src/content/**` (articles, posts, projects, weekly). Также доступен ручной
запуск через `workflow_dispatch`.

## Пошаговый процесс

### 1. Подготовка окружения

- Checkout репозитория с полной историей (нужна ветка `posts_db`)
- Установка Node.js и зависимостей
- Загрузка `posts.yaml` из ветки `posts_db` в корень рабочей директории

### 2. Подготовка контента (`prepare-post.ts`)

**Вход:** список файлов из env var `FILES` — пути через пробел.

**Алгоритм:**

1. Парсинг строки файлов из `FILES`
2. Фильтрация — оставить только `index.ru.md` из
   `src/content/{articles,posts,projects,weekly}/`
3. Определение типа по пути, slug — из имени папки
4. Загрузка шаблонов из `scripts/templates.json`
5. Валидация: 0 файлов → тихий выход (код 0)
6. Цикл по каждому файлу:
   - Чтение markdown, YAML-фронтматтер (массивы `tags` поддерживаются)
   - `draft: true` → пропуск с логом `Skipping draft`
   - Тизер по типу:
     - articles — текст до `<!--more-->`;
     - posts — весь текст поста;
     - weekly — `excerpt` из фронтматтера (fallback — текст из тела);
     - projects — `description` из фронтматтера (fallback — текст из тела);
   - URL по типу:
     - projects — `demo`, иначе `repo`, иначе `/projects/{slug}`;
     - остальные — url-шаблон из `templates.json`;
   - Применение шаблона с подстановкой переменных ({title}, {excerpt}, {url},
     {description} и т.д.)
7. Сохранение массива метаданных в `.post-meta.json` (включает `socialText`)

**Выход:** `.post-meta.json` (массив с `socialText`)

### 3. Публикация (`publish.ts`)

**Вход:** `.post-meta.json` + `posts.yaml` + секреты API.

**Алгоритм:**

1. Чтение метаданных из `.post-meta.json`
2. Загрузка `posts.yaml` (ветка `posts_db`)
3. Цикл по каждому элементу:
   - **Новый контент** (slug отсутствует в БД): отправка в Telegram и Discord,
     сохранение message IDs
   - **Существующий** (slug есть): редактирование сообщений по сохранённым ID;
     если редактирование не удалось (403/404) — отправка нового сообщения
   - Запись message IDs в `posts.yaml`
   - Задержка 1с между элементами (rate limit)
4. Выход с кодом 0

**Выход:** обновлённый `posts.yaml` на диске + отправленные/отредактированные
сообщения

### 4. Сохранение базы данных

- Коммит `posts.yaml` в ветку `posts_db` (шаг `if: always()` — сохраняет даже
  при частичном сбое)
- Сообщение коммита: `Update posts database [skip ci]` (чтобы не зациклить
  workflow)

## Формат `posts.yaml`

```yaml
articles:
  ecs-deep-dive:
    telegram: 123456
    discord: 789012
posts:
  my-thought:
    telegram: 123456
    discord: 789012
projects:
  now-playing:
    telegram: 234567
    discord: 890123
weekly:
  2026-09-07:
    telegram: 345678
    discord: 901234
```

- ключ первого уровня — тип контента (articles/posts/projects/weekly);
- ключ второго уровня — slug (имя папки единицы);
- slug могут совпадать между типами — БД разделена по типам.

## Локальное использование

```bash
# Подготовка тестового поста
FILES='src/content/posts/my-thought/index.ru.md' npx tsx scripts/prepare-post.ts

# Проверить, что получилось
Get-Content .post-meta.json

# Публикация (нужны токены в .env.publish)
npm run publish
```

## Ограничения

- Несколько постов → задержка 1с между отправками (rate limit Telegram/Discord)
- Telegram: `parse_mode: Markdown` — контент должен быть совместим с Markdown
  Telegram
- Редактирование ограничено платформами: Telegram — 48 часов, Discord —
  бессрочно
- В автопостинг попадает только `index.ru.md`; переводы и черновики — никогда
