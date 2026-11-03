import { describe, expect, it } from "vitest";
import { getArticles } from "$lib/articles";

const hasContent =
	Object.keys(import.meta.glob("/src/content/articles/*/index.ru.md")).length >
	0;

describe.skipIf(!hasContent)("articles with a teaser", () => {
	it("teaser is non-empty and cut at the marker", () => {
		for (const article of getArticles("ru")) {
			expect(article.teaser, `${article.slug}: no teaser`).toBeTruthy();
			expect(article.teaser).not.toMatch(/<!--more-->/);
			expect(article.teaser).not.toMatch(/\s{2,}/);
		}
	});

	it("reading time is computed", () => {
		for (const article of getArticles("ru")) {
			expect(article.readingTime, `${article.slug}`).toBeGreaterThan(0);
		}
	});

	it("a translation has its own teaser", () => {
		const ru = getArticles("ru").find((item) => item.slug === "oklch-tokens");
		const en = getArticles("en").find((item) => item.slug === "oklch-tokens");

		expect(ru?.teaser).toBeTruthy();
		expect(en?.teaser).toBeTruthy();
		expect(ru?.teaser).not.toBe(en?.teaser);
	});
});
