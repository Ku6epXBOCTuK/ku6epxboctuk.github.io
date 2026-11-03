import type { ContentType } from "@ku6epxboctuk/content-core/shared";
import { type Article, getArticles } from "$lib/articles";
import { type ContentLang, DEFAULT_LANG } from "$lib/content";
import { getPosts, type Post } from "$lib/posts";
import { getProjects, type Project } from "$lib/projects";

// NOTE: one index spans all three types, because one tag can sit on a post,
// an article and a project at once.

export interface Taggable {
	type: ContentType;
	key: string;
	tags: string[];
}

export interface TagIndex<T extends Taggable = Taggable> {
	tag: string;
	count: number;
	items: T[];
}

export type TaggedEntry =
	| { type: "post"; key: string; tags: string[]; post: Post }
	| { type: "article"; key: string; tags: string[]; article: Article }
	| { type: "project"; key: string; tags: string[]; project: Project };

// NOTE: count desc, then alphabetical; any other order would reshuffle the page between builds.
export function collectTags<T extends Taggable>(items: T[]): TagIndex<T>[] {
	const buckets = new Map<string, T[]>();

	for (const item of items) {
		// NOTE: the validator allows repeated tags in shared json, so dedupe before counting.
		for (const raw of new Set(item.tags)) {
			const tag = raw.trim();
			if (!tag) continue;

			const bucket = buckets.get(tag);
			if (bucket) bucket.push(item);
			else buckets.set(tag, [item]);
		}
	}

	return [...buckets.entries()]
		.map(([tag, tagged]) => ({ tag, count: tagged.length, items: tagged }))
		.sort(
			(a, b) =>
				b.count - a.count ||
				a.tag.localeCompare(b.tag, undefined, { sensitivity: "base" }),
		);
}

export function taggedEntries(lang: ContentLang = DEFAULT_LANG): TaggedEntry[] {
	return [
		...getPosts(lang).map(
			(post): TaggedEntry => ({
				type: "post",
				key: `post:${post.slug}`,
				tags: post.tags,
				post,
			}),
		),
		...getArticles(lang).map(
			(article): TaggedEntry => ({
				type: "article",
				key: `article:${article.slug}`,
				tags: article.tags,
				article,
			}),
		),
		...getProjects(lang).map(
			(project): TaggedEntry => ({
				type: "project",
				key: `project:${project.slug}`,
				tags: project.tags,
				project,
			}),
		),
	];
}

export function tagIndex(
	lang: ContentLang = DEFAULT_LANG,
): TagIndex<TaggedEntry>[] {
	return collectTags(taggedEntries(lang));
}
