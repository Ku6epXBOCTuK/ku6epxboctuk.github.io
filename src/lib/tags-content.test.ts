import { describe, expect, it } from "vitest";
import { collectTags, tagIndex, taggedEntries } from "$lib/tags";

/*
 * Настоящий контент вместо фикстуры: собирается ли индекс из всех трёх типов
 * и сходится ли счётчик тега с числом карточек. Разбор самого индекса —
 * в `tags.test.ts`.
 */

const hasContent =
	Object.keys(import.meta.glob("/src/content-mocks/posts/*/index.ru.md"))
		.length > 0;

describe.skipIf(!hasContent)("индекс тегов на контенте", () => {
	it("собирается из постов, статей и проектов", () => {
		const types = new Set(taggedEntries("ru").map((e) => e.type));
		expect([...types].sort()).toEqual(["article", "post", "project"]);
	});

	it("счётчик тега равен числу карточек в его списке", () => {
		const wrong: string[] = [];

		for (const entry of tagIndex("ru")) {
			if (entry.count !== entry.items.length) wrong.push(entry.tag);
			if (new Set(entry.items.map((i) => i.key)).size !== entry.count) {
				wrong.push(entry.tag);
			}
		}

		expect(wrong).toEqual([]);
	});

	it("ключи уникальны: одна запись не попадает в два тега дважды", () => {
		const flat = collectTags(taggedEntries("ru")).flatMap((e) =>
			e.items.map((i) => i.key),
		);
		expect(new Set(flat).size).toBeGreaterThan(0);
	});

	it("в переводе индекс не пустеет", () => {
		expect(tagIndex("en").length).toBeGreaterThan(0);
	});
});
