import { createPairLoader, type LocalizedItem } from "$lib/loaders";
import {
	oldContentSlug,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/posts/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

interface PostBase extends ContentEntry {
	link?: string;
}

export interface Post extends PostBase, LocalizedItem {
	urlSlug: string;
}

const loader = createPairLoader<PostBase>({
	modules,
	toItem: (entry, fm) => ({
		...entry,
		link: typeof fm.link === "string" ? fm.link : undefined,
	}),
});

function urlSlugFor(lang: ContentLang, slug: string): string {
	return lang === "ru" ? slug : `${slug}.${lang}`;
}

export function getPosts(): Post[] {
	return loader.getItems().map((item) => ({
		...item,
		urlSlug: urlSlugFor(item.lang, item.slug),
	}));
}

export function getPost(slug: string) {
	const { lang, base } = oldContentSlug(slug);
	const item = loader.getLangs(base).includes(lang)
		? loader.getItem(base, lang)
		: undefined;
	if (!item) return undefined;
	const meta = { ...item, urlSlug: urlSlugFor(item.lang, item.slug) };
	return { meta, PostComponent: meta.module.default };
}

export function getPostSlugs(): string[] {
	const slugs: string[] = [];
	for (const base of loader.getSlugs()) {
		slugs.push(base);
		if (loader.getLangs(base).includes("en")) slugs.push(`${base}.en`);
	}
	return slugs;
}
