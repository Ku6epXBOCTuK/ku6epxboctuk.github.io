// NOTE: these tests need the node environment, not a DOM.
// @vitest-environment node

import { describe, expect, it, afterAll } from "vitest";
import { dropFixtureRoots, fixtureRoot } from "./fixture.ts";
import { loadEntry, saveEntry } from "./entries.ts";
import { entryFromFlat } from "./entry-types.ts";
import { readJsonFile } from "./json.ts";
import { metaFile } from "./paths.ts";
import { afterAll, describe, expect, it } from "vitest";
import { dropFixtureRoots, fixtureRoot } from "./fixture.ts";
import { loadEntry, saveEntry } from "./entries.ts";
import { entryFromFlat } from "./entry-types.ts";
import { readJsonFile } from "./json.ts";
import { metaFile } from "./paths.ts";
import { collectTags, planTagRename, removeTag, renameTag } from "./tags.ts";
import type { SchemaType } from "./types.ts";

// NOTE: tags live inside units, so a rename rewrites them everywhere. The real
// risk is losing a record: the shared json is rewritten whole, so two writes in a
// row can overwrite each other.
async function seed(
	root: string,
	type: SchemaType,
	slug: string,
	tags: string[],
): Promise<void> {
	const entry = entryFromFlat(type, slug, { title: slug, date: "2026-09-30" });
	entry.shared.tags = tags;
	await saveEntry(type, slug, entry, root);
}

describe("tags in content", () => {
	afterAll(dropFixtureRoots);
	it("counts usage across all types and sorts by frequency", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);
		await seed(root, "project", "c", ["css", "rust"]);

		const index = collectTags(root);

		expect(index.map((entry) => entry.tag)).toEqual(["css", "rust", "svelte"]);
		expect(index[0].units).toHaveLength(3);
		expect(index[0].units.map((u) => u.slug).sort()).toEqual(["a", "b", "c"]);
	});

	it("does not count a tag twice even when repeated in one unit", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "css"]);

		expect(collectTags(root)[0].units).toHaveLength(1);
	});

	it("an empty tree gives an empty list", () => {
		expect(collectTags(fixtureRoot())).toEqual([]);
	});

	it("a rename rewrites the tag in every unit and loses no records", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);
		await seed(root, "project", "c", ["css"]);

		const result = await renameTag("css", "style", root);

		expect(result.changed).toBe(3);

		// NOTE: all three records must stay on disk; the real risk is a record
		// without tags overwriting the previous one when the shared json is rewritten.
		const posts = readJsonFile<Record<string, { tags?: string[] }>>(
			metaFile("post", root),
		);
		const articles = readJsonFile<Record<string, { tags?: string[] }>>(
			metaFile("article", root),
		);
		const projects = readJsonFile<Record<string, { tags?: string[] }>>(
			metaFile("project", root),
		);

		expect(Object.keys(posts ?? {})).toEqual(["a"]);
		expect(Object.keys(articles ?? {})).toEqual(["b"]);
		expect(Object.keys(projects ?? {})).toEqual(["c"]);

		expect(posts?.a.tags).toEqual(["style", "svelte"]);
		expect(articles?.b.tags).toEqual(["style"]);
		expect(projects?.c.tags).toEqual(["style"]);

		expect(collectTags(root).map((entry) => entry.tag)).toEqual([
			"style",
			"svelte",
		]);
	});

	it("a rename collapses the duplicate, not the tag", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "style"]);

		await renameTag("css", "style", root);

		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["style"]);
	});

	it("renaming to itself does nothing", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		expect((await renameTag("css", "css", root)).changed).toBe(0);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("an empty new name is a removal", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);

		await renameTag("css", "", root);

		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["svelte"]);
	});

	it("an invalid name leaves content alone", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		await expect(renameTag("css", "a,b", root)).rejects.toThrow(/запят/);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("removal drops the tag everywhere and leaves the rest", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);

		const result = await removeTag("css", root);

		expect(result.changed).toBe(2);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["svelte"]);
		expect(collectTags(root).map((entry) => entry.tag)).toEqual(["svelte"]);
	});

	it("removing an absent tag does nothing", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		expect((await removeTag("rust", root)).changed).toBe(0);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("the last tag goes, the record stays", async () => {
		const root = fixtureRoot();
		await seed(root, "project", "p", ["css"]);

		await removeTag("css", root);

		const entry = loadEntry("project", "p", root);
		expect(entry).toBeDefined();
		expect(entry?.shared.tags ?? []).toEqual([]);
		expect(entry?.versions.ru.frontmatter.title).toBe("p");
	});

	it("removal matches the tag regardless of case", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["CSS"]);

		await removeTag("css", root);

		expect(loadEntry("post", "a", root)?.shared.tags ?? []).toEqual([]);
	});

	it("the preview sees the merge in advance, not after", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "style"]);
		await seed(root, "post", "b", ["css", "style"]);
		await seed(root, "post", "c", ["css5"]);

		const merge = planTagRename("style", "css", root);

		expect(merge.merge).toBe(true);
		expect(merge.affected).toBe(2);
		// NOTE: `a` and `b` already carry both tags, so they are the duplicates.
		expect(merge.duplicates).toBe(2);
		// NOTE: `c` with `css5` is not part of the merge, so `css` stays in the
		// same two records.
		expect(merge.resultCount).toBe(2);
	});

	it("rename preview without a merge", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["style"]);

		const plan = planTagRename("style", "css", root);

		expect(plan.merge).toBe(false);
		expect(plan.exists).toBe(true);
		expect(plan.affected).toBe(1);
		expect(plan.duplicates).toBe(0);
		expect(plan.resultCount).toBe(1);
	});

	it("renaming to itself breaks nothing", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		const plan = planTagRename("css", "css", root);

		expect(plan.merge).toBe(false);
		expect(plan.affected).toBe(1);
	});

	it("previewing an absent tag does not throw", () => {
		const plan = planTagRename("nope", "css", fixtureRoot());

		expect(plan.exists).toBe(false);
		expect(plan.affected).toBe(0);
		expect(plan.merge).toBe(false);
	});

	it("the preview rejects an invalid name", () => {
		expect(() => planTagRename("css", "a,b", fixtureRoot())).toThrow(/запят/);
	});
});
