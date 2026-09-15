import {
	DEFAULT_LANG,
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

export function getArticle(
	slug: string,
	lang: ContentLang = DEFAULT_LANG,
): Article | undefined {
	return loader.getItem(slug, lang);
}

export function getArticleBaseSlugs(): string[] {
	return loader.getSlugs();
}
