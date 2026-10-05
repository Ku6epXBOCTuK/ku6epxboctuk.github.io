import type { ContentType } from "@ku6epxboctuk/content-core/shared";
import type { MarkdownModule, SharedRecord } from "$lib/content";
import type { ModuleMap } from "$lib/loaders";
import { sharedFrom } from "$lib/shared";

/*
 * Где что искать для каждого типа. Одна таблица вместо четырёх копий.
 *
 * Паттерны приходится писать литералами: `import.meta.glob` разворачивается на
 * этапе сборки и не понимает переменных в пути. Поэтому повторение остаётся в
 * данных — но оно теперь одно, в одном месте, и добавление типа означает одну
 * запись здесь, а не правки в каждом модуле контента.
 *
 * `weekly` здесь нет: он не в `CONTENT_TYPES` и генерируется отдельно.
 */

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

/**
 * Сырой текст статьи нужен только для времени чтения, поэтому и глоб тут один:
 * заводить такие для остальных типов незачем. Лежит рядом с остальными паттернами
 * ради одного места, а не ради симметрии.
 */
export const articleRawModules = import.meta.glob<string>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		query: "?raw",
		import: "default",
		eager: true,
	},
);
