import { describe, expect, it } from "vitest";
import { collectTags, type Taggable } from "$lib/tags";

function item(type: Taggable["type"], slug: string, tags: string[]): Taggable {
	return { type, key: `${type}:${slug}`, tags };
}

describe("collectTags", () => {
	it("counts one tag spanning different types", () => {
		const index = collectTags([
			item("post", "a", ["css"]),
			item("article", "b", ["css"]),
			item("project", "c", ["css"]),
		]);

		expect(index).toHaveLength(1);
		expect(index[0].tag).toBe("css");
		expect(index[0].count).toBe(3);
		expect(index[0].items.map((i) => i.key)).toEqual([
			"post:a",
			"article:b",
			"project:c",
		]);
	});

	it("sorts by frequency and then alphabetically", () => {
		const index = collectTags([
			item("post", "a", ["rare", "common"]),
			item("post", "b", ["common", "mid"]),
			item("post", "c", ["common", "mid"]),
		]);

		expect(index.map((i) => i.tag)).toEqual(["common", "mid", "rare"]);
	});

	it("the same tag on one unit is not counted twice", () => {
		const index = collectTags([item("post", "a", ["css", "css"])]);

		expect(index[0].count).toBe(1);
		expect(index[0].items).toHaveLength(1);
	});

	it("trims spaces and drops empty tags", () => {
		const index = collectTags([item("post", "a", [" svelte ", "", "   "])]);

		expect(index.map((i) => i.tag)).toEqual(["svelte"]);
	});

	it("case does not silently merge tags", () => {
		const index = collectTags([
			item("post", "a", ["CSS"]),
			item("post", "b", ["css"]),
		]);

		expect(index).toHaveLength(2);
	});

	it("empty content gives an empty index, not an error", () => {
		expect(collectTags([])).toEqual([]);
	});
});
