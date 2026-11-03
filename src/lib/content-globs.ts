import type { ContentType } from "@ku6epxboctuk/content-core/shared";
import type { MarkdownModule, SharedRecord } from "$lib/content";
import type { ModuleMap } from "$lib/loaders";
import { sharedFrom } from "$lib/shared";

// NOTE: import.meta.glob expands at build time and rejects variables, so every path
// stays a literal; this table is the one place those literals are repeated.

const MODULES: Record<ContentType, ModuleMap> = {
	post: import.meta.glob<MarkdownModule>(
		"/src/content/posts/*/index.{ru,en}.md",
		{
			eager: true,
		},
	),
	article: import.meta.glob<MarkdownModule>(
		"/src/content/articles/*/index.{ru,en}.md",
		{ eager: true },
	),
	project: import.meta.glob<MarkdownModule>(
		"/src/content/projects/*/index.{ru,en}.md",
		{ eager: true },
	),
};

const SHARED: Record<ContentType, SharedRecord> = {
	post:
		sharedFrom(
			import.meta.glob<SharedRecord>("/src/content/posts.json", {
				eager: true,
				import: "default",
			}),
		) ?? {},
	article:
		sharedFrom(
			import.meta.glob<SharedRecord>("/src/content/articles.json", {
				eager: true,
				import: "default",
			}),
		) ?? {},
	project:
		sharedFrom(
			import.meta.glob<SharedRecord>("/src/content/projects.json", {
				eager: true,
				import: "default",
			}),
		) ?? {},
};

export function modulesOf(type: ContentType): ModuleMap {
	return MODULES[type];
}

export function sharedOf(type: ContentType): SharedRecord {
	return SHARED[type];
}

// NOTE: raw article text exists only for reading time; other types need no raw glob.
export const articleRawModules = import.meta.glob<string>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		query: "?raw",
		import: "default",
		eager: true,
	},
);
