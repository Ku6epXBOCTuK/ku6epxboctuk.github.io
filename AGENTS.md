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

Full guide: `docs/writing.md`.

Two schemas are the source of truth for allowed fields, split by where a field
physically lives: `frontmatter.json` declares only `translatable` fields,
`content.schema.json` declares `shared` and `local`. `npm run lint:content`
errors on anything not in them, and `packages/content-core/src/fields.ts` is
kept in sync with both by a test.

A unit is up to five files, and only `scope` in `fields.ts` decides which is
which:

```txt
<type>/<slug>/index.<lang>.md    # translatable
<type>s.json                     # shared
<type>s.local.json               # local, gitignored
```

`packages/content-core` owns all content logic (read, write, validate) and is
the only thing that knows this layout; `packages/editor` is a SvelteKit app on
top of it that edits an `Entry` and knows nothing about files. The site reads
the same layout at build time and merges shared over translatable.

To move a field between files, change its `scope` in `fields.ts` and both schema
files. No read or write code changes.

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
