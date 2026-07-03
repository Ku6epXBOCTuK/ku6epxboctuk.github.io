# AGENTS.md

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
