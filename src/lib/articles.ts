import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import { createPairLoader, type LocalizedItem } from "$lib/loaders";

const WORDS_PER_MINUTE = 200;

export function readingMinutes(raw: string): number {
	const body = raw.replace(/^---[\s\S]*?---\s*/, "");
	const words = body.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

const rawModules = import.meta.glob<string>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		query: "?raw",
		import: "default",
		eager: true,
	},
);

const minutesByPath = new Map(
	Object.entries(rawModules).map(([path, raw]) => [path, readingMinutes(raw)]),
);

export interface Article extends ContentEntry, LocalizedItem {
	readingTime?: number;
}

function withReadingTime(item: Article): Article {
	const path = `/src/content/articles/${item.slug}/index.${item.lang}.md`;
	const readingTime = minutesByPath.get(path);
	return readingTime ? { ...item, readingTime } : item;
}

const loader = createPairLoader<ContentEntry>({
	modules,
	toItem: (entry) => entry,
});

export function getArticles(lang: ContentLang = DEFAULT_LANG): Article[] {
	return loader.getItems(lang).map(withReadingTime);
}

export function getArticleDetail(
	slug: string,
	lang: ContentLang = DEFAULT_LANG,
) {
	const meta = loader.getItem(slug, lang);
	if (!meta) return undefined;
	return {
		meta: withReadingTime(meta),
		altMeta: withReadingTime(loader.getItem(slug, otherLang(lang)) ?? meta),
	};
}

export function getArticleBaseSlugs(): string[] {
	return loader.getSlugs();
}
