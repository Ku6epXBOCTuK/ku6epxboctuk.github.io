---
title: sveltekit static template
date: apr 2026
excerpt:
  A streamlined foundation for SvelteKit static sites, with TypeScript, strict
  linting, and comprehensive testing.
tag: template sveltekit svelte
---

Every developer has a "favorite" way to start a project. After building several
static sites, I realized I was spending too much time re-configuring the same
linting rules and testing suites. To solve this, I developed the **SvelteKit
Static Template**—a streamlined foundation designed for speed, strictness, and
reliability.

---

## The Philosophy: Static First, Quality Always

The core of this template is the **SvelteKit Static Adapter**. By targeting
static generation, the resulting sites can be hosted anywhere (GitHub Pages,
Vercel, or a simple Nginx server) without needing a Node.js runtime.

However, "static" doesn't mean "simple." I wanted a professional-grade
environment, which led to the inclusion of:

- **Svelte 5 with Runes:** Leveraging the latest reactivity model for cleaner,
  more predictable code.
- **Strict Type Safety:** Full TypeScript integration to catch errors before
  they ever hit the browser.
- **Comprehensive Testing:** A dual-layer approach using **Vitest** for unit
  logic and **Playwright** for end-to-end browser testing.

---

## Enforcing Code Quality

One of my main frustrations in collaborative projects is "messy" code. To combat
this, I integrated a strict linting stack:

- **ESLint & Stylelint:** Configured to be uncompromising. The setup explicitly
  bans `console.log` and "magic numbers," forcing developers to write
  intentional, documented code.
- **Prettier:** Handles the formatting so we never argue about semicolons again.
- **Command Orchestration:** I added a `check:all` command. In one go, it runs
  the formatter, style linter, script linter, Svelte-check, and unit tests. It’s
  the ultimate "gatekeeper" before a commit.

---

## The Secret Sauce: CSS Variables Linter

A unique challenge in modern CSS is managing variables. It’s incredibly easy to
use a variable like `var(--brand-blue)` only to realize later it was never
defined, or to keep old, unused variables bloating your stylesheets.

To fix this, I wrote a custom script: `scripts/css-vars.js`. This **CSS
Variables Linter**:

1. **Throws an Error** if a variable is used but not defined.
2. **Issues a Warning** if a variable is defined but never used.

This ensures the CSS remains lean and prevents the "broken UI" bugs that often
slip through standard linters.

---

## How to Use It

The template is designed to be as accessible as possible. If you have Node.js 22
or higher, you can spin up a new project in seconds:

```sh
npx degit Ku6epXBOCTuK/sveltekit-template my-site
cd my-site
npm install
npm run dev
```

### Key Commands at a Glance

| Command                 | Action                                           |
| :---------------------- | :----------------------------------------------- |
| `npm run build`         | Generates a static site in the `build/` folder.  |
| `npm run check:all`     | The full suite: Lints, Svelte-check, and Vitest. |
| `npm run test:e2e`      | Runs Playwright for real-world browser testing.  |
| `npm run lint:css-vars` | Runs the custom CSS variable validator.          |

This template is my way of ensuring that every new project starts with a solid
foundation, allowing me to focus on building features rather than fighting with
configurations. Feel free to use it, fork it, or suggest improvements!
