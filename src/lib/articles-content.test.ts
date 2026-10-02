import { describe, expect, it } from "vitest";
import { getArticles } from "$lib/articles";

/*
 * Склейка «загрузчик + сырой текст»: тизер и время чтения приходят не из
 * frontmatter, а из raw-файла, поэтому проверяется на настоящих моках.
 * Само извлечение разобрано в `articles.test.ts`.
 */

const hasContent =
	Object.keys(import.meta.glob("/src/content-mocks/articles/*/index.ru.md"))
		.length > 0;

describe.skipIf(!hasContent)("статьи с тизером", () => {
	it("тизер непустой и обрезан маркером", () => {
		for (const article of getArticles("ru")) {
			expect(article.teaser, `${article.slug}: нет тизера`).toBeTruthy();
			expect(article.teaser).not.toMatch(/<!--more-->/);
			expect(article.teaser).not.toMatch(/\s{2,}/);
		}
	});

	it("время чтения посчитано", () => {
		for (const article of getArticles("ru")) {
			expect(article.readingTime, `${article.slug}`).toBeGreaterThan(0);
		}
	});

	it("в переводе тизер свой", () => {
		const ru = getArticles("ru").find((item) => item.slug === "oklch-tokens");
		const en = getArticles("en").find((item) => item.slug === "oklch-tokens");

		expect(ru?.teaser).toBeTruthy();
		expect(en?.teaser).toBeTruthy();
		expect(ru?.teaser).not.toBe(en?.teaser);
	});
});
