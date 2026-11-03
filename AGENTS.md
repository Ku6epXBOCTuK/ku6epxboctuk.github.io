# AGENTS.md

## Verification

Run after any change, in order:

```bash
pnpm format
pnpm check
pnpm lint
```

Also `pnpm lint:content` when `src/content/**` changed, and
`pnpm --filter @ku6epxboctuk/editor check` when `packages/**` changed.

## Content

`src/content/**` is written by the editor (`pnpm editor`), not by hand. The
layout and the field-to-file mapping are defined in `packages/content-core`
(`fields.ts`); `frontmatter.json` and `content.schema.json` mirror it and must
stay in sync — a test enforces that. `weekly` is generated, never edited.

## Code rules

- No color literals in CSS, only variables from `src/app.css`. A new color is
  added there first.
- Comments only for genuinely complex code or non-obvious constraints. No file
  headers, no narration, no JSDoc on obvious functions. Lint directives stay.
