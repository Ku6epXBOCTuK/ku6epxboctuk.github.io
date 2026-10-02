import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
} from "$lib/content";
import { createPairLoader, type LocalizedItem } from "$lib/loaders";
import { modulesOf, sharedOf } from "$lib/content-globs";

interface PostBase extends ContentEntry {
	link?: string;
}

export interface Post extends PostBase, LocalizedItem {}

const loader = createPairLoader<PostBase>({
	modules: modulesOf("post"),
	shared: sharedOf("post"),
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
