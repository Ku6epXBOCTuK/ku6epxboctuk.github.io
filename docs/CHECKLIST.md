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

- [ ] `src/articles/` — пустая папка
- [ ] Очистить `src/posts/` и `src/projects/` (старые файлы удалить; нужное
      скопировать руками)
- [ ] `lib/`: `content.ts`, `articles.ts` (ru/en), `posts.ts`, `projects.ts`
      (`repo`/`demo`, без `type`), `weekly.ts`
- [ ] Роуты `/articles`, `/posts`, `/projects`, `/weekly` + навигация
- [ ] `frontmatter.json`: 4 схемы, убрать `Type`, pageFolders `articles`/`posts`
- [ ] `lint-content.ts`: 4 типа, ISO, `tags[]`, `<!--more-->`, `generated`,
      `lang`
- [ ] `prepare-post.ts` + `templates.json`: `articles`, excerpt по типам,
      url-шаблоны
- [ ] `publish.yml`: триггер на `articles/**` и `posts/**`
- [ ] `new-content.ts` + `npm run new` (`--lang en`)
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
