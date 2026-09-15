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
- [x] Токены в `app.css`: 4 набора (kawaii/soft × light/dark) + композитные
- [x] Переименовать и добавить CSS-переменные во всех компонентах (старые →
      новые имена)
- [x] Инлайн-скрипт в `app.html` (`data-skin` + `dark`, без FOUC), Google Fonts
      CDN убран
- [x] `ThemeToggle.svelte` (две кнопки: скин 🎀/`</>` + режим ☀/☾), временно
      смонтирован в layout, переедет в Topbar
- [x] Каркас `Topbar`/`Footer`/hero-окно, контейнер 1120px
- [x] Карточки `Card` + `PostCard`/`ArticleCard`/`ProjectCard`/`ReportCard`,
      списки и детальные
- [x] Главная: «последние N постов» (`HOME_RECENT_POSTS`)
- [x] Бейдж «draft» в dev
- [x] i18n: рефактор загрузчиков контента — `src/lib/loaders.ts`
      (`createFlatLoader` + `createPairLoader`), статьи/посты/projects/weekly
      тонкими обёртками, публичный API прежний
- [x] i18n: загрузчики понимают язык — `lang` в `createFlatLoader`,
      `lang`-параметры у геттеров, `urlSlug`-суффикс убран (слаг базовый),
      геттеры базовых слагов для `entries()`
- [x] i18n: префикс `/ru/…` `/en/…` — маршруты в `src/routes/[lang]/…`, у
      каждого `+page.ts` `entries()` по ru/en и `load()` с `lang` в `data`
- [x] i18n: корневые редиректы старых URL: `/`, `/about`, `/posts[/slug]`,
      `/articles[/slug]`, `/projects`, `/weekly[/slug]` → тот же путь под `/ru/`
      или `/en/` по языку браузера (`Redirect.svelte` + `goto`;
      `prerender.entries: ["*"]`)
- [x] i18n: ссылки с префиксом языка: Topbar, Footer, карточки, HomePage
- [x] Локализация сайта: словарь `src/lib/i18n.ts`, UI-строки по
      `$page.params.lang`
- [x] Переключатель ru/en в топбаре
- [x] Везде 2 языка: weekly/projects → pair-загрузчики (`lang`/`langs`),
      gen-mocks пишет пары для всех типов, `needs_translation` во всех схемах,
      lint-content: warn без `index.en.md` у всех типов; планы переписаны
- [x] Кнопка смены языка контента на детальных: «read in english» / «читать на
      русском» (всегда видима, справа от заголовка)
- [ ] Проекты: внутренняя детальная страница (иконка, статус, описание, обложка
      `image`, repo + demo), карточка ведёт внутрь
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
