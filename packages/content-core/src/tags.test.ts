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

/*
 * Теги живут внутри единиц, поэтому «переименовать тег» — это переписать его во
 * всех единицах. Главное, что тут можно сломать, — потерять запись: теги лежат в
 * общем json, а он переписывается целиком, так что две записи подряд могут
 * затереть друг друга. Проверяется именно это.
 *
 * Правила самих тегов — в `tag-rules.test.ts`.
 */

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

describe("теги в контенте", () => {
	afterAll(dropFixtureRoots);
	it("считает использования по всем типам и сортирует по частоте", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);
		await seed(root, "project", "c", ["css", "rust"]);

		const index = collectTags(root);

		expect(index.map((entry) => entry.tag)).toEqual(["css", "rust", "svelte"]);
		expect(index[0].units).toHaveLength(3);
		expect(index[0].units.map((u) => u.slug).sort()).toEqual(["a", "b", "c"]);
	});

	it("не считает один тег дважды, даже если он повторён в единице", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "css"]);

		expect(collectTags(root)[0].units).toHaveLength(1);
	});

	it("пустое дерево даёт пустой список", () => {
		expect(collectTags(fixtureRoot())).toEqual([]);
	});

	it("переименование переписывает тег во всех единицах и не теряет записи", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);
		await seed(root, "project", "c", ["css"]);

		const result = await renameTag("css", "style", root);

		expect(result.changed).toBe(3);

		// Все три записи должны остаться на диске: главный риск — что запись
		// без тегов затёрла предыдущую при переписывании общего json.
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

	it("переименование схлопывает дубль, а не сам тег", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "style"]);

		await renameTag("css", "style", root);

		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["style"]);
	});

	it("переименование в себя ничего не делает", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		expect((await renameTag("css", "css", root)).changed).toBe(0);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("пустое имя нового тега равносильно удалению", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);

		await renameTag("css", "", root);

		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["svelte"]);
	});

	it("кривое имя не трогает контент", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		await expect(renameTag("css", "a,b", root)).rejects.toThrow(/запят/);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("удаление убирает тег везде, но не трогает остальные", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "svelte"]);
		await seed(root, "article", "b", ["css"]);

		const result = await removeTag("css", root);

		expect(result.changed).toBe(2);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["svelte"]);
		expect(collectTags(root).map((entry) => entry.tag)).toEqual(["svelte"]);
	});

	it("удаление тега, которого нигде нет, ничего не делает", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		expect((await removeTag("rust", root)).changed).toBe(0);
		expect(loadEntry("post", "a", root)?.shared.tags).toEqual(["css"]);
	});

	it("последний тег исчезает, а запись остаётся", async () => {
		const root = fixtureRoot();
		await seed(root, "project", "p", ["css"]);

		await removeTag("css", root);

		const entry = loadEntry("project", "p", root);
		expect(entry).toBeDefined();
		expect(entry?.shared.tags ?? []).toEqual([]);
		expect(entry?.versions.ru.frontmatter.title).toBe("p");
	});

	it("удаление по разному регистру находит тот же тег", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["CSS"]);

		await removeTag("css", root);

		expect(loadEntry("post", "a", root)?.shared.tags ?? []).toEqual([]);
	});

	it("предпросмотр видит слияние заранее, а не после", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css", "style"]);
		await seed(root, "post", "b", ["css", "style"]);
		await seed(root, "post", "c", ["css5"]);

		const merge = planTagRename("style", "css", root);

		expect(merge.merge).toBe(true);
		expect(merge.affected).toBe(2);
		// `a` и `b` уже содержат оба тега — они и есть дубли.
		expect(merge.duplicates).toBe(2);
		// `css` и так стоит в `a` и `b`, а `c` с `css5` слияние не касается:
		// после него `css` остаётся в тех же двух записях.
		expect(merge.resultCount).toBe(2);
	});

	it("предпросмотр переименования без слияния", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["style"]);

		const plan = planTagRename("style", "css", root);

		expect(plan.merge).toBe(false);
		expect(plan.exists).toBe(true);
		expect(plan.affected).toBe(1);
		expect(plan.duplicates).toBe(0);
		expect(plan.resultCount).toBe(1);
	});

	it("предпросмотр переименования в себя ничего не ломает", async () => {
		const root = fixtureRoot();
		await seed(root, "post", "a", ["css"]);

		const plan = planTagRename("css", "css", root);

		expect(plan.merge).toBe(false);
		expect(plan.affected).toBe(1);
	});

	it("предпросмотр несуществующего тега не падает", () => {
		const plan = planTagRename("nope", "css", fixtureRoot());

		expect(plan.exists).toBe(false);
		expect(plan.affected).toBe(0);
		expect(plan.merge).toBe(false);
	});

	it("предпросмотр отвергает кривое имя", () => {
		expect(() => planTagRename("css", "a,b", fixtureRoot())).toThrow(/запят/);
	});
});
