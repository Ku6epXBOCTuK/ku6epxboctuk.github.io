---
title: offline-first chrome extension
date: apr 2026
excerpt: why i switched from start.me to building my own extension
tag: engineering creative chrome
---

Building a custom browser extension is often born out of pure frustration with
existing tools. Based on the development notes for **XBOCT-page**, here is an
overview of why this project exists, the technical hurdles faced during CI/CD
setup, and a surprising encounter with "internet archaeology."

---

## Why I Built My Own Chrome Start Page

It started when my previous tool, _start.me_, became a bottleneck rather than a
productivity aid. Frequent connection lags meant staring at a blank white screen
for 10 seconds just to access a bookmark. This constant loss of focus, combined
with aggressive "Pro" upsells and a total service crash that forced a complete
cache wipe, was the final straw.

I decided to build an **offline-first** extension. The goal is simple:

- **Instant Load:** Show locally stored data immediately.
- **Zero Distractions:** No ads, no $25 subscriptions.
- **Total Control:** No more losing access to links because a third-party server
  is down.

---

## The GitHub CI Struggle: A "Quick Task" That Took Days

Setting up automation for the project turned into a 24-hour marathon. The plan
was to use **cocogitto** to automate version bumping, changelog generation, and
releases. However, I hit several roadblocks:

1. **State Management:** Splitting the process into three separate workflows
   meant the version number had to be constantly recalculated or passed between
   runners.
2. **Security Bypass:** The standard `GITHUB_TOKEN` couldn't bypass branch
   protection rules. I had to create a dedicated **GitHub App** to gain the
   necessary permissions for automated commits to the main branch.

There is a lingering question regarding security: if a workflow can access a
secret bot ID and secret, what stops a malicious actor from just using those
same secrets in a modified workflow? Despite these architectural questions, the
pipeline is now fully operational with protected branches and green-check-only
PRs.

---

## Internet Archaeology: The Netscape Bookmark Format

When it came time to import my existing bookmarks, I expected a modern JSON or
XML file. Instead, I was greeted by a file full of `<DT>` and `<DL>` tags in all
caps.

It turns out that **Netscape HTML**, a format from a browser that died decades
ago, is still the industry standard for bookmark exports in 2026. Writing a
parser for this "fossil" was an unexpected detour. While **XBOCT-page** uses
JSON for its native imports and exports, supporting this ancient standard was a
necessary step for compatibility.

---

### Project Status

The extension is currently in an early state, featuring a toggle between light
and dark themes and basic bookmark management. It’s "raw" software—if you can’t
figure out how to install an unpacked extension, it isn't ready for you yet. For
the rest, PRs are welcome, but let’s coordinate first to avoid overlapping work.
