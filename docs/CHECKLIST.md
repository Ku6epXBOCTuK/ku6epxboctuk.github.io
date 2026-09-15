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
- [x] `frontmatter.json`: 4 схемы, убрать `Type` и `lang`, добавить
      `needs_translation` (post/article), pageFolders `src/content/articles`,
      `src/content/posts`
- [x] `lint-content.ts`: 4 типа, ISO, `tags[]`, `<!--more-->`, `generated`,
      `needs_translation` только в `index.en.md`
- [x] `prepare-post.ts` + `templates.json`: `articles` (пути `src/content/*`,
      тизер), excerpt по типам, url-шаблоны
- [x] `publish.yml`: триггер на `src/content/articles/**` и
      `src/content/posts/**`
- [x] `new-content.ts` + `npm run new` (создаёт пару `index.ru.md` +
      `index.en.md` с `needs_translation: true`; `--sync` досоздаёт копию для
      существующей)
- [x] `docs/writing.md` — как писать пост/статью
- [x] Переписать `docs/publish.md` и `docs/test-publish-flow.md` под новую схему

## 2. Фаза design

- [x] `@fontsource/comfortaa` + `@fontsource/nunito` установить
- [ ] Токены в `app.css`: 4 набора (kawaii/soft × light/dark) + композитные
- [ ] Переименовать CSS-переменные во всех компонентах (старые → новые имена)
- [ ] Инлайн-скрипт в `app.html` (`data-skin` + `dark`, без FOUC)
- [ ] `ThemeToggle.svelte` (две кнопки: скин 🎀/`</>` + режим ☀/☾)
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

## 4. Финальные шаги

- [ ] Проверить флоу выкладывания
- [ ] Обдумать - удобно ли это или нет, как работать с переводами и т.д.
