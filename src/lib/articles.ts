import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import { createPairLoader, type LocalizedItem } from "$lib/loaders";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface Article extends ContentEntry, LocalizedItem {}

const loader = createPairLoader<ContentEntry>({
	modules,
	toItem: (entry) => entry,
});

export function getArticles(lang: ContentLang = DEFAULT_LANG): Article[] {
	return loader.getItems(lang);
}

export function getArticleDetail(
	slug: string,
	lang: ContentLang = DEFAULT_LANG,
) {
	const meta = loader.getItem(slug, lang);
	if (!meta) return undefined;
	return { meta, altMeta: loader.getItem(slug, otherLang(lang)) ?? meta };
}

export function getArticleBaseSlugs(): string[] {
	return loader.getSlugs();
}
