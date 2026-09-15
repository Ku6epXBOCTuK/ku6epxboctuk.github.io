# Чеклист редизайна и реструктуризации

> Порядок: реструктуризация доков → content-model → design → automation. Каждый
> шаг кода — `npm run format` → `check` → `lint`.

## 0. Реструктуризация документации

- [x] Перенести планы: `docs/plans/*.md` → `docs/plan-*.md`
- [x] Удалить папку `docs/plans/`
- [x] Перенести устаревшее (`publish.md`, `test-publish-flow.md`, `todo.md`) в
      `docs/archive/`
- [x] Удалить `refs/initial_design`

## 1. Фаза content-model

- [x] `src/content/articles/` — пустая папка
- [x] Очистить `src/content/posts/` и `src/content/projects/` (старые файлы
      удалить; нужное скопировать руками)
- [x] `lib/`: `content.ts`, `articles.ts` (ru/en), `posts.ts`, `projects.ts`
      (`repo`/`demo`, без `type`), `weekly.ts`
- [x] Роуты `/articles`, `/posts`, `/projects`, `/weekly` + навигация
- [ ] `frontmatter.json`: 4 схемы, убрать `Type` и `lang`, добавить
      `needs_translation` (post/article), pageFolders `src/content/articles`,
      `src/content/posts`
- [ ] `lint-content.ts`: 4 типа, ISO, `tags[]`, `<!--more-->`, `generated`,
      `needs_translation` только в `index.en.md`
- [ ] `prepare-post.ts` + `templates.json`: `articles` (пути `src/content/*`,
      тизер), excerpt по типам, url-шаблоны
- [ ] `publish.yml`: триггер на `src/content/articles/**` и
      `src/content/posts/**`
- [ ] `new-content.ts` + `npm run new` (создаёт пару `index.ru.md` +
      `index.en.md` с `needs_translation: true`; `--sync` досоздаёт копию для
      существующей)
- [ ] `docs/writing.md` — как писать пост/статью
- [ ] Переписать `docs/publish.md` и `docs/test-publish-flow.md` под новую схему
- [ ] Проверить флоу выкладывания (перенос одного поста/статьи вручную)

## 2. Фаза design

- [ ] Токены `app.css` (4 набора), `@fontsource`, инлайн-скрипт, `ThemeToggle`
- [ ] Каркас `Topbar`/`Footer`/hero-окно, контейнер 1120px
- [ ] Карточки `Card` + `PostCard`/`ArticleCard`/`ProjectCard`/`ReportCard`,
      списки и детальные
- [ ] Главная: «последние N постов» (`HOME_RECENT_POSTS`)
- [ ] Бейдж «draft» в dev
- [ ] Переключатель ru/en
- [ ] Мелочи: focus-visible, чипы TG/Discord, спонсоры, `readingTime`, мобайл
- [ ] Обновить `README.md` под новый сайт

## 3. Фаза automation

- [ ] `projects.yaml` — манифест
- [ ] `sync-projects.ts` (+ `npm run sync:projects`)
- [ ] `gen-weekly.ts` (+ `npm run gen:weekly`)
- [ ] `frontmatter.json`: project `status`, weekly `generated`
- [ ] `lint-content.ts` — warn (не ошибка) для `need_review`
- [ ] `docs/automation.md` — как запускать и читать отчёты
