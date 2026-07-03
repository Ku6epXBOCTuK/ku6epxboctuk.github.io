---
title: why i stopped using ui component libraries
date: jan 2026
excerpt:
  building ui from scratch gives you exactly what you need. thoughts on design
  systems, consistency, and the cost of abstraction.
tag: design
---

The transition from using massive UI libraries to writing custom styles is a
common evolution for developers seeking more control and performance. Based on
my recent work with SvelteKit templates and the **XBOCT-page** extension, here
is why I’ve moved away from "off-the-shelf" UI frameworks.

---

## The Weight of Convenience: Why I Quit UI Libraries

For years, the go-to move for any new project was to install a UI library like
MUI, Vuetify, or Bootstrap. They promised speed and a professional look out of
the box. However, after building several projects—including my own custom
browser extension and a high-performance SvelteKit template—I realized these
libraries often cost more than they save.

### 1. The "Bloat" Problem

UI libraries are designed to be everything to everyone. When you install one,
you aren't just getting a button; you're getting 500 variations of that button,
plus modals, sliders, and date pickers you’ll never use. This leads to:

- **Bundle Bloat:** Even with tree-shaking, these libraries increase the final
  JavaScript and CSS size.
- **Dependency Hell:** You become tied to the library's update cycle, which can
  break your project when a new version of the base framework (like Svelte 5) is
  released.

### 2. The Battle Against "The Brand"

Most UI libraries have a very distinct look. If you want your project to look
unique, you spend hours "fighting" the library’s default CSS. Overriding deep
nested styles often leads to using `!important` or complex selectors, which
makes the codebase brittle. I’ve found it much cleaner to use **CSS Variables**
and native styling to build exactly what I need from the start.

### 3. Performance and the "White Screen"

As I noted during the development of my **XBOCT-page** extension, speed is
everything. UI libraries often rely on complex runtime logic to handle styles
(CSS-in-JS), which can delay the initial render.

- **Offline-First:** By moving away from heavy libraries, I can ensure my
  projects load instantly from local storage without waiting for a massive
  framework to initialize.
- **Static Simplicity:** In my SvelteKit template, I prioritize the **static
  adapter**, which works best when the CSS is lean and predictable.

### 4. Custom Tooling for Better Quality

Instead of relying on a library to keep things consistent, I now use custom
automated tools. For example, in my latest projects, I use a **CSS Variables
Linter**.

- It ensures that I don't use undefined variables.
- It warns me if I have unused styles bloating my file. This gives me the
  consistency of a UI library without the unnecessary overhead.

---

## Conclusion

Building without a UI library requires more effort upfront—you have to build
your own "bricks." However, the result is a project that is faster, easier to
maintain, and truly under your control. Whether it’s a browser extension or a
static site, the freedom from "black-box" dependencies is worth the extra code.
