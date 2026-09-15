import {
	collectByFolder,
	fileLang,
	published,
	toEntry,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import { dev } from "$app/environment";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/articles/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface Article {
	slug: string;
	urlSlug: string;
	lang: ContentLang;
	langs: ContentLang[];
	title: string;
	date: string;
	tags: string[];
	draft: boolean;
	image?: string;
	module: MarkdownModule;
}

interface RawArticle {
	lang: ContentLang;
	entry: ContentEntry;
}

const ALL_LANGS: ContentLang[] = ["ru", "en"];
const URL_LANG = /^(.+)\.(ru|en)$/;

const grouped = collectByFolder(
	Object.entries(modules).map(([path, module]) => ({
		lang: fileLang(path),
		entry: toEntry(path, module),
	})),
	(item) => item.entry.slug,
);

const byBase = (() => {
	if (dev) return grouped;
	const visible = new Map<string, RawArticle[]>();
	for (const [base, group] of grouped) {
		const kept = group.filter((item) => !item.entry.draft);
		if (kept.length > 0) visible.set(base, kept);
	}
	return visible;
})();

function availableLangs(base: string): ContentLang[] {
	const group = byBase.get(base);
	if (!group) return [];
	return ALL_LANGS.filter((lang) => group.some((item) => item.lang === lang));
}

function toArticle(raw: RawArticle): Article {
	return {
		slug: raw.entry.slug,
		urlSlug:
			raw.lang === "ru" ? raw.entry.slug : `${raw.entry.slug}.${raw.lang}`,
		lang: raw.lang,
		langs: availableLangs(raw.entry.slug),
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
	const lang = match ? (match[2] as ContentLang) : "ru";
	const raw = byBase.get(base)?.find((item) => item.lang === lang);
	return raw ? toArticle(raw) : undefined;
}

export function getArticleSlugs(): string[] {
	const slugs: string[] = [];
	for (const [base, group] of byBase) {
		slugs.push(base);
		for (const item of group) {
			if (item.lang === "en") slugs.push(`${base}.en`);
		}
	}
	return slugs;
}
