import {
	published,
	toEntry,
	type ContentEntry,
	type MarkdownModule,
} from "$lib/content";

const modules = import.meta.glob<MarkdownModule>("/src/content/articles/*.md", {
	eager: true,
});

export type ArticleLang = "ru" | "en";

export interface Article {
	slug: string;
	urlSlug: string;
	lang: ArticleLang;
	langs: ArticleLang[];
	title: string;
	date: string;
	tags: string[];
	draft: boolean;
	image?: string;
	module: MarkdownModule;
}

interface RawArticle {
	lang: ArticleLang;
	base: string;
	entry: ContentEntry;
}

const ALL_LANGS: ArticleLang[] = ["ru", "en"];
const LANG_SUFFIX = /^(.+)\.(ru|en)\.md$/;
const URL_LANG = /^(.+)\.(ru|en)$/;

const byBase = new Map<string, RawArticle[]>();

for (const [path, module] of Object.entries(modules)) {
	const raw = parseFile(path, module);
	const group = byBase.get(raw.base);
	if (group) group.push(raw);
	else byBase.set(raw.base, [raw]);
}

function parseFile(path: string, module: MarkdownModule): RawArticle {
	const file = path.split("/").pop() ?? "";
	const entry = toEntry(path, module);
	const suffix = LANG_SUFFIX.exec(file);
	if (suffix) {
		return { lang: suffix[2] as ArticleLang, base: suffix[1], entry };
	}
	const fmLang = entry.module.frontmatter.lang;
	return {
		lang: fmLang === "en" ? "en" : "ru",
		base: entry.slug,
		entry,
	};
}

function availableLangs(base: string): ArticleLang[] {
	const group = byBase.get(base);
	if (!group) return [];
	return ALL_LANGS.filter((lang) => group.some((item) => item.lang === lang));
}

function toArticle(raw: RawArticle): Article {
	return {
		slug: raw.base,
		urlSlug: raw.lang === "ru" ? raw.base : `${raw.base}.${raw.lang}`,
		lang: raw.lang,
		langs: availableLangs(raw.base),
		title: raw.entry.title,
		date: raw.entry.date,
		tags: raw.entry.tags,
		draft: raw.entry.draft,
		image: raw.entry.image,
		module: raw.entry.module,
	};
}

export function getArticles(): Article[] {
	const articles = [...byBase.values()].map((group) => {
		const main = group.find((item) => item.lang === "ru") ?? group[0]!;
		return toArticle(main);
	});
	return published(articles);
}

export function getArticle(slug: string): Article | undefined {
	const match = URL_LANG.exec(slug);
	const base = match ? match[1] : slug;
	const lang = match ? (match[2] as ArticleLang) : "ru";
	const raw = byBase.get(base)?.find((item) => item.lang === lang);
	return raw ? toArticle(raw) : undefined;
}
