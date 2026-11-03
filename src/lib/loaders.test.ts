import { describe, expect, it } from "vitest";
import { createPairLoader } from "$lib/loaders";
import { mergeShared, sharedFrom } from "$lib/shared";
import type { MarkdownModule } from "$lib/content";

const module = (frontmatter: Record<string, unknown>): MarkdownModule =>
	({ default: () => null, frontmatter }) as unknown as MarkdownModule;

const MODULES = {
	"/src/content/articles/hello/index.ru.md": module({ title: "Заголовок" }),
	"/src/content/articles/hello/index.en.md": module({ title: "Title" }),
};

const SHARED = {
	hello: {
		date: "2026-09-30",
		tags: ["svelte", "будни"],
		image: "/images/hello.png",
		draft: false,
	},
};

describe("shared fields from json", () => {
	it("reach the entry together with the translatable md fields", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry) => entry,
		});

		const [item] = loader.getItems("ru");

		expect(item.slug).toBe("hello");
		expect(item.title).toBe("Заголовок");
		expect(item.date).toBe("2026-09-30");
		expect(item.tags).toEqual(["svelte", "будни"]);
		expect(item.image).toBe("/images/hello.png");
	});

	it("a translation reads its own file while shared fields stay the same", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry) => entry,
		});

		const en = loader.getItem("hello", "en");

		expect(en?.title).toBe("Title");
		expect(en?.date).toBe("2026-09-30");
		expect(en?.tags).toEqual(["svelte", "будни"]);
	});

	it("no shared json: the entry is built from md and does not crash", () => {
		const loader = createPairLoader({
			modules: MODULES,
			toItem: (entry) => entry,
		});

		const [item] = loader.getItems("ru");
		expect(item.title).toBe("Заголовок");
		expect(item.date).toBe("");
		expect(item.tags).toEqual([]);
	});

	it("merged frontmatter is passed to toItem", () => {
		const loader = createPairLoader({
			modules: MODULES,
			shared: SHARED,
			toItem: (entry, fm) => ({ ...entry, link: fm.date }),
		});

		expect(loader.getItem("hello", "ru")?.link).toBe("2026-09-30");
	});
});

describe("sharedFrom", () => {
	it("unwraps the `{path: record}` map into the record itself", () => {
		const glob = { "/src/content/articles.json": SHARED };
		expect(sharedFrom(glob)).toEqual(SHARED);
	});

	it("empty glob gives undefined, not an object keyed by path", () => {
		expect(sharedFrom({})).toBeUndefined();
		expect(sharedFrom(undefined)).toBeUndefined();
	});
});

describe("mergeShared", () => {
	it("a later source overrides the earlier one by field, not by slug", () => {
		const merged = mergeShared(
			{ hello: { date: "2026-01-01", tags: ["старые"] } },
			{ hello: { date: "2026-09-30" }, other: { date: "2026-09-01" } },
		);

		expect(merged).toEqual({
			hello: { date: "2026-09-30", tags: ["старые"] },
			other: { date: "2026-09-01" },
		});
	});
});
