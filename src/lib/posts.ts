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
import type { Component } from "svelte";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/posts/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface Post extends ContentEntry {
	lang: ContentLang;
	urlSlug: string;
	link?: string;
}

interface RawPost {
	lang: ContentLang;
	entry: ContentEntry;
}

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
	const visible = new Map<string, RawPost[]>();
	for (const [base, group] of grouped) {
		const kept = group.filter((item) => !item.entry.draft);
		if (kept.length > 0) visible.set(base, kept);
	}
	return visible;
})();

function toPost(raw: RawPost): Post {
	return {
		...raw.entry,
		lang: raw.lang,
		urlSlug:
			raw.lang === "ru" ? raw.entry.slug : `${raw.entry.slug}.${raw.lang}`,
		link:
			typeof raw.entry.module.frontmatter.link === "string"
				? raw.entry.module.frontmatter.link
				: undefined,
	};
}

export function getPosts(): Post[] {
	const posts = [...byBase.values()].map((group) => {
		const main = group.find((item) => item.lang === "ru") ?? group[0]!;
		return toPost(main);
	});
	return published(posts);
}

export function getPost(
	slug: string,
): { meta: Post; PostComponent: Component } | undefined {
	const match = URL_LANG.exec(slug);
	const base = match ? match[1] : slug;
	const lang = match ? (match[2] as ContentLang) : "ru";
	const raw = byBase.get(base)?.find((item) => item.lang === lang);
	if (!raw) return undefined;
	const meta = toPost(raw);
	return { meta, PostComponent: meta.module.default };
}

export function getPostSlugs(): string[] {
	const slugs: string[] = [];
	for (const [base, group] of byBase) {
		slugs.push(base);
		for (const item of group) {
			if (item.lang === "en") slugs.push(`${base}.en`);
		}
	}
	return slugs;
}
