import { describe, expect, it } from "vitest";
import { getArticles } from "$lib/articles";
import { getPosts } from "$lib/posts";
import { getProjects } from "$lib/projects";
import { articleRawModules, modulesOf, sharedOf } from "$lib/content-globs";
import { CONTENT_TYPES } from "@ku6epxboctuk/content-core/shared";

const hasContent = Object.keys(modulesOf("post")).length > 0;

describe.skipIf(!hasContent)("glob table", () => {
	it.each(CONTENT_TYPES)(
		"%s: modules and shared records share one slug",
		(type) => {
			const modules = Object.keys(modulesOf(type));
			const shared = Object.keys(sharedOf(type));

			expect(modules.length).toBeGreaterThan(0);
			expect(shared.length).toBeGreaterThan(0);

			const slugs = new Set(
				modules.map((path) => path.split("/").slice(-2, -1)[0] ?? ""),
			);
			expect(modules.length).toBe(slugs.size * 2);
		},
	);

	it("every type has both shared records and language files", () => {
		for (const type of CONTENT_TYPES) {
			const slugsFromModules = new Set(
				Object.keys(modulesOf(type)).map(
					(path) => path.split("/").slice(-2, -1)[0] ?? "",
				),
			);
			const slugsFromShared = new Set(Object.keys(sharedOf(type)));

			expect(
				[...slugsFromShared].every((slug) => slugsFromModules.has(slug)),
				`${type}: json record without a folder`,
			).toBe(true);
		}
	});

	it("reading time is computed from the same articles", () => {
		expect(Object.keys(articleRawModules).length).toBe(
			Object.keys(modulesOf("article")).length,
		);
	});

	it("content reaches the loaders and shared fields are valid", () => {
		// NOTE: values may be missing by design; only malformed values are failures.
		const bad: string[] = [];

		for (const post of getPosts("ru")) {
			if (post.date && !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
				bad.push(`posts/${post.slug}: date ${post.date}`);
			}
		}

		for (const article of getArticles("ru")) {
			if (article.date && !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
				bad.push(`articles/${article.slug}: date ${article.date}`);
			}
		}

		for (const project of getProjects("ru")) {
			if (project.repo && !project.repo.startsWith("https://")) {
				bad.push(`projects/${project.slug}: repo ${project.repo}`);
			}
		}

		for (const entry of [
			...getPosts("ru"),
			...getArticles("ru"),
			...getProjects("ru"),
		]) {
			for (const tag of entry.tags) {
				if (!tag.trim()) bad.push(`${entry.slug}: empty tag`);
			}
		}

		expect(bad).toEqual([]);
	});
});
