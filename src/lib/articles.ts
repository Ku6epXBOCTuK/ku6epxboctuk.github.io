import {
	DEFAULT_LANG,
	fileLang,
	slugOf,
	otherLang,
	type ContentEntry,
	type ContentLang,
} from "$lib/content";
import { createPairLoader, type LocalizedItem } from "$lib/loaders";
import { articleRawModules, modulesOf, sharedOf } from "$lib/content-globs";

const WORDS_PER_MINUTE = 200;
const MORE_MARKER = "<!--more-->";

export function readingMinutes(raw: string): number {
	const body = raw.replace(/^---[\s\S]*?---\s*/, "");
	const words = body.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

// NOTE: the validator requires <!--more--> for articles and forbids it for posts;
// posts feed the whole text, articles only the part before the marker.
export function teaserOf(raw: string): string {
	const body = raw.replace(/^---[\s\S]*?---\s*/, "");
	const [head] = body.split(MORE_MARKER);
	return plainText(head ?? "");
}

function plainText(markdown: string): string {
	return markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^\s{0,3}#{1,6}\s+/gm, "")
		.replace(/^\s{0,3}>\s?/gm, "")
		.replace(/^\s*[-*+]\s+/gm, "")
		.replace(/[*_`]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

const rawBySlugLang = new Map(
	Object.entries(articleRawModules).map(([path, raw]) => [
		`${slugOf(path)}:${fileLang(path)}`,
		raw,
	]),
);

export interface Article extends ContentEntry, LocalizedItem {
	readingTime?: number;
	/** Текст до `<!--more-->`; пустой, если маркера нет. */
	teaser?: string;
}

function withRaw(item: Article): Article {
	const raw = rawBySlugLang.get(`${item.slug}:${item.lang}`);
	if (!raw) return item;

	const teaser = teaserOf(raw);
	const readingTime = readingMinutes(raw);
	return {
		...item,
		readingTime,
		...(teaser ? { teaser } : {}),
	};
}

const loader = createPairLoader<ContentEntry>({
	modules: modulesOf("article"),
	shared: sharedOf("article"),
	toItem: (entry) => entry,
});

export function getArticles(lang: ContentLang = DEFAULT_LANG): Article[] {
	return loader.getItems(lang).map(withRaw);
}

export function getArticleDetail(
	slug: string,
	lang: ContentLang = DEFAULT_LANG,
) {
	const meta = loader.getItem(slug, lang);
	if (!meta) return undefined;
	return {
		meta: withRaw(meta),
		altMeta: withRaw(loader.getItem(slug, otherLang(lang)) ?? meta),
	};
}

export function getArticleBaseSlugs(): string[] {
	return loader.getSlugs();
}
