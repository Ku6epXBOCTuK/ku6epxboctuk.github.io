import { describe, expect, it } from "vitest";
import { readingMinutes, teaserOf } from "$lib/articles";

const ARTICLE = `---
title: Заголовок
---

Первый абзац, он и есть тизер.

Второй абзац — уже не тизер.

<!--more-->

Остальная часть статьи.
`;

describe("teaserOf", () => {
	it("takes everything before the marker and nothing after", () => {
		expect(teaserOf(ARTICLE)).toBe(
			"Первый абзац, он и есть тизер. Второй абзац — уже не тизер.",
		);
	});

	it("drops frontmatter instead of showing it as text", () => {
		expect(teaserOf(ARTICLE)).not.toMatch(/Заголовок/);
	});

	it("strips markup: links, headings, lists, emphasis", () => {
		const teaser = teaserOf(`## Заголовок раздела

Ссылка на [документацию](https://example.com) и **жирное** слово.

- пункт один
- пункт два

<!--more-->
`);
		expect(teaser).toBe(
			"Заголовок раздела Ссылка на документацию и жирное слово. пункт один пункт два",
		);
	});

	it("an image does not become a stray space", () => {
		expect(teaserOf(`![alt](/images/x.webp) и текст\n\n<!--more-->`)).toBe(
			"и текст",
		);
	});

	it("without the marker returns the whole text: the validator catches it, the page must not", () => {
		expect(teaserOf("Просто текст.")).toBe("Просто текст.");
	});

	it("empty input gives an empty teaser, not a string of spaces", () => {
		expect(teaserOf("")).toBe("");
		expect(teaserOf("<!--more-->\n\nТекст после.")).toBe("");
	});
});

describe("readingMinutes", () => {
	it("counts words, not characters, and handles empty text", () => {
		expect(readingMinutes(ARTICLE)).toBe(1);
		expect(readingMinutes("")).toBe(1);

		const long = "слово ".repeat(400).trim();
		expect(readingMinutes(long)).toBe(2);
	});
});
