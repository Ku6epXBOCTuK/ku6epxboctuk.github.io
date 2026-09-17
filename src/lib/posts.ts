import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import { createPairLoader, type LocalizedItem } from "$lib/loaders";

const modules = {
	...import.meta.glob<MarkdownModule>("/src/content/posts/*/index.{ru,en}.md", {
		eager: true,
	}),
	...import.meta.glob<MarkdownModule>(
		"/src/content-mocks/posts/*/index.{ru,en}.md",
		{ eager: true },
	),
};

interface PostBase extends ContentEntry {
	link?: string;
}

export interface Post extends PostBase, LocalizedItem {}

const loader = createPairLoader<PostBase>({
	modules,
	toItem: (entry, fm) => ({
		...entry,
		link: typeof fm.link === "string" ? fm.link : undefined,
	}),
});

export function getPosts(lang: ContentLang = DEFAULT_LANG): Post[] {
	return loader.getItems(lang);
}

export function getPost(slug: string, lang: ContentLang = DEFAULT_LANG) {
	const meta = loader.getItem(slug, lang);
	if (!meta) return undefined;
	return {
		meta,
		PostComponent: meta.module.default,
		altMeta: loader.getItem(slug, otherLang(lang)) ?? meta,
	};
}

export function getPostBaseSlugs(): string[] {
	return loader.getSlugs();
}
