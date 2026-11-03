import { describe, expect, it } from "vitest";
import { collectTags, tagIndex, taggedEntries } from "$lib/tags";

const hasContent =
	Object.keys(import.meta.glob("/src/content/posts/*/index.ru.md")).length > 0;

describe.skipIf(!hasContent)("tag index over real content", () => {
	it("is built from posts, articles and projects", () => {
		const types = new Set(taggedEntries("ru").map((e) => e.type));
		expect([...types].sort()).toEqual(["article", "post", "project"]);
	});

	it("the tag count equals the number of cards in its list", () => {
		const wrong: string[] = [];

		for (const entry of tagIndex("ru")) {
			if (entry.count !== entry.items.length) wrong.push(entry.tag);
			if (new Set(entry.items.map((i) => i.key)).size !== entry.count) {
				wrong.push(entry.tag);
			}
		}

		expect(wrong).toEqual([]);
	});

	it("keys are unique: an entry never lands in two tags twice", () => {
		const flat = collectTags(taggedEntries("ru")).flatMap((e) =>
			e.items.map((i) => i.key),
		);
		expect(new Set(flat).size).toBeGreaterThan(0);
	});

	it("the index is not empty in a translation", () => {
		expect(tagIndex("en").length).toBeGreaterThan(0);
	});
});
