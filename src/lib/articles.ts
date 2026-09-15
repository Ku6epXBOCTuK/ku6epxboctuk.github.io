import { createPairLoader, type LocalizedItem } from "$lib/loaders";
import {
	oldContentSlug,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface Article extends ContentEntry, LocalizedItem {
	urlSlug: string;
}

const loader = createPairLoader<ContentEntry>({
	modules,
	toItem: (entry) => entry,
});

function urlSlugFor(lang: ContentLang, slug: string): string {
	return lang === "ru" ? slug : `${slug}.${lang}`;
}

export function getArticles(): Article[] {
	return loader.getItems().map((item) => ({
		...item,
		urlSlug: urlSlugFor(item.lang, item.slug),
	}));
}

export function getArticle(slug: string): Article | undefined {
	const { lang, base } = oldContentSlug(slug);
	const item = loader.getLangs(base).includes(lang)
		? loader.getItem(base, lang)
		: undefined;
	if (!item) return undefined;
	return { ...item, urlSlug: urlSlugFor(item.lang, item.slug) };
}

export function getArticleSlugs(): string[] {
	const slugs: string[] = [];
	for (const base of loader.getSlugs()) {
		slugs.push(base);
		if (loader.getLangs(base).includes("en")) slugs.push(`${base}.en`);
	}
	return slugs;
}
