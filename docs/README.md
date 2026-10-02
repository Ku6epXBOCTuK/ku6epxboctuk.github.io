# Site Docs

Личный сайт Ku6epXBOCTuK. Статический, без бэкенда и CMS: весь контент —
markdown в git.

## Стек

- SvelteKit 2 + Svelte 5 (runes), Vite 7, TypeScript
- `adapter-static` (SPA, `ssr = false`, `prerender = true`) → GitHub Pages
- `vite-plugin-svelte-md` (markdown компилится в Svelte-компоненты)
- Comfortaa + Nunito, self-hosted через `@fontsource`
- OKLCH-токены в `src/app.css`, 4 темы (kawaii/soft × light/dark)
- ESLint + Prettier + Stylelint, Vitest (unit) + Playwright (e2e)

## Монорепо

```txt
web-site/                    сайт — статика на GitHub Pages
packages/
  content-core/              вся логика контента: чтение, запись, валидация
  editor/                    локальный редактор: SvelteKit + adapter-node
```

`content-core` — единственный источник правды о контенте. Его читают и
`scripts/lint-content.ts`, и редактор, поэтому правила валидации у них общие.
Вход `./shared` (`types.ts`, `fields.ts`, `slug.ts`, `entry-types.ts`) не тянет
`node:fs` и безопасен для браузера; всё остальное — только для сервера.

## Контент

```txt
src/content/
  posts/<slug>/index.{ru,en}.md        # переводимое: заголовок, текст
  articles/<slug>/index.{ru,en}.md
  projects/<slug>/index.{ru,en}.md
  weekly/<YYYY-MM-DD>/index.{ru,en}.md
  <type>s.json                          # общее: дата, теги, обложка, draft
  <type>s.local.json                    # локальное: путь к клону (в гитигноре)
```

Куда уходит поле, решает `scope` в `packages/content-core/src/fields.ts`:
`translatable` — в `index.<lang>.md`, `shared` — в `<type>s.json`, `local` — в
`<type>s.local.json`. Раскладку по файлам делает репозиторий, потребители знают
только `Entry`.

Загрузчики в `src/lib/{posts,articles,projects,weekly}.ts` собирают всё через
`import.meta.glob` на этапе сборки: md — за переводимым, `<type>s.json` — за
общим, и склеивают их в одну карту. Черновики (`draft: true`) фильтруются в
production.

Редактор запускается локально и пишет файлы напрямую, в git он не коммитит.

**Как добавлять контент — [docs/writing.md](writing.md).** Коротко:
`pnpm editor` → открыть ссылку из консоли → заполнить форму → `git push`.

`weekly` редактор не правит: отчёты генерируются из git-логов, план в
[docs/plan-weekly.md](plan-weekly.md).

Перенос данных из frontmatter в json закончен: раскладка, репозиторий,
валидация, редактор и сайт работают по новой модели. Как это устроено и почему
так — [docs/plan-split-content.md](plan-split-content.md).

## Скрипты

| Команда              | Что делает                                  |
| -------------------- | ------------------------------------------- |
| `pnpm editor`        | локальный редактор контента                 |
| `pnpm dev`           | дев-сервер сайта                            |
| `pnpm build`         | продакшен-сборка сайта                      |
| `pnpm format`        | prettier --write                            |
| `pnpm check`         | svelte-check                                |
| `pnpm lint`          | prettier --check + eslint                   |
| `pnpm lint:css`      | stylelint                                   |
| `pnpm lint:css-vars` | запрет прямых цветов в CSS                  |
| `pnpm lint:content`  | валидация frontmatter                       |
| `pnpm test:run`      | vitest                                      |
| `pnpm test:e2e`      | playwright                                  |
| `pnpm verify`        | format → check → lint:all → test:run        |
| `pnpm mocks:gen`     | сгенерировать мок-контент в `content-mocks` |

`src/content-mocks/` в гитигноре и на сайт не попадает — это заглушки для
разработки.

## Деплой

Push в `main` → `.github/workflows/deploy.yml` → GitHub Pages. Workflow ставит
зависимости через `pnpm install --frozen-lockfile`, публикации в соцсети больше
нет: всё происходит по `git push`.
