# AGENTS.md

## Content

Content is edited through the local editor, never by hand.

```bash
pnpm editor
```

It prints a `http://127.0.0.1:4321/` link. There is no auth: the editor binds
loopback only and relies on that, so it must never be started on a public
interface. The editor writes `src/content/**` on disk, formats with prettier
before writing, and shows the result of `lint:content` for the edited unit.
Types: `post`, `article`, `project`. `weekly` is generated automatically and is
not editable here.

Full guide: `docs/writing.md`. `frontmatter.json` is the source of truth for
allowed fields — `npm run lint:content` errors on anything not in it, and
`packages/content-core/src/fields.ts` is kept in sync with it by a test.

Layout: `packages/content-core` owns all content logic (read, write, validate);
`packages/editor` is a SvelteKit app on top of it that renders the form. The
site itself stays static and is not touched.

## Critical Rules

### CSS Colors

**NEVER use colors directly in CSS.** Only use CSS variables from `src/app.css`:

```css
✅ color: var(--accent)
✅ background: var(--bg)
❌ color: #4ade80
❌ background: #111
```

If a new color is needed, add it as a variable to `src/app.css` first.

### Verification

After completing ANY task, ALWAYS run these npm scripts in order:

```bash
npm run format
npm run check
npm run lint
```

Only use these commands - do not run other verification methods.

If you touched anything under `src/content/`, also run `npm run lint:content`.
For changes in `packages/`, run `pnpm --filter @ku6epxboctuk/editor check`.
