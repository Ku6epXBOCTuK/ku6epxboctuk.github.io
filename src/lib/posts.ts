import {
	published,
	toEntry,
	type ContentEntry,
	type MarkdownModule,
} from "$lib/content";
import type { Component } from "svelte";

const modules = import.meta.glob<MarkdownModule>("/src/content/posts/*.md", {
	eager: true,
});

export interface Post extends ContentEntry {
	link?: string;
}

const allPosts: Post[] = Object.entries(modules).map(([path, module]) => {
	const entry = toEntry(path, module);
	return {
		...entry,
		link:
			typeof entry.module.frontmatter.link === "string"
				? entry.module.frontmatter.link
				: undefined,
	};
});

export function getPosts(): Post[] {
	return published(allPosts);
}

export function getPost(
	slug: string,
): { meta: Post; PostComponent: Component } | undefined {
	const post = allPosts.find((item) => item.slug === slug);
	if (!post) return undefined;
	return { meta: post, PostComponent: post.module.default };
}
