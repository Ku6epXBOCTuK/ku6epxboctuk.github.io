# Site Docs

Technical documentation for the Ku6epXBOCTuK personal site.

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes), Vite 7, TypeScript
- `adapter-static` (SPA, `ssr = false`, `prerender = true`) → GitHub Pages
- Comfortaa (display) + Nunito (body) — self-hosted via `@fontsource`
- OKLCH design tokens, 4 theme variants (kawaii/soft × light/dark)
- `vite-plugin-svelte-md` (markdown as Svelte components)
- ESLint 9 + Prettier + Stylelint
- Vitest (unit) + Playwright (E2E)

## Project structure

```txt
src/
  app.css              # Design tokens (4 theme variants)
  lib/
    content.ts         # Core types & helpers
    loaders.ts         # createFlatLoader / createPairLoader
    articles.ts        # Article loader
    posts.ts           # Post loader
    projects.ts        # Project loader
    weekly.ts          # Weekly report loader
    i18n.ts            # UI string translations (ru/en)
    config.ts          # Site constants
  routes/
    [lang]/            # /ru/… and /en/…
      posts/
      articles/
      projects/
      weekly/
  content/
    posts/
    articles/
    projects/
    weekly/
scripts/
  lint-content.ts      # Frontmatter validator
  new-content.ts       # Content wizard
  publish.ts           # Social auto-posting
  prepare-post.ts      # Build publish payload
```

## Key scripts

| Command                      | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `npm run dev`                | Local dev server                                  |
| `npm run build`              | Production build                                  |
| `npm run format`             | Auto-format (Prettier)                            |
| `npm run check`              | Type-check (`svelte-kit sync && svelte-check`)    |
| `npm run lint`               | Format check + ESLint                             |
| `npm run lint:css`           | Stylelint                                         |
| `npm run lint:css-vars`      | Enforce CSS variable usage                        |
| `npm run lint:content`       | Validate content frontmatter                      |
| `npm run new <type> <slug>`  | Create new post or article                        |
| `npm run sync <type> <slug>` | Create missing `index.en.md` for existing content |
| `npm run check:all`          | Full CI pipeline (format → lint → check → test)   |

## Development

```bash
npm install
npm run dev
```

## Content model

Each content unit lives in `src/content/{type}/<slug>/` with a pair of files:

```txt
index.ru.md   # Russian (default)
index.en.md   # English
```

**Types:** `posts`, `articles`, `projects`, `weekly`. See `docs/writing.md` for
the full content creation guide.

## Deployment

Deploys to GitHub Pages on push to `main` via GitHub Actions. A separate
`publish.yml` workflow posts new content to Telegram & Discord.
