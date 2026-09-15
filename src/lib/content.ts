import { dev } from "$app/environment";
import type { Component } from "svelte";

export interface MarkdownModule<
	TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
> {
	default: Component;
	frontmatter: TFrontmatter;
}

export interface ContentEntry {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	draft: boolean;
	image?: string;
	module: MarkdownModule;
}

export const DEFAULT_LANG = "ru";
export type ContentLang = "ru" | "en";
export const LANGS: readonly ContentLang[] = ["ru", "en"];

export function oldContentSlug(value: string): {
	lang: ContentLang;
	base: string;
} {
	const match = /^(.+)\.(ru|en)$/.exec(value);
	return match
		? { lang: match[2] as ContentLang, base: match[1] }
		: { lang: DEFAULT_LANG, base: value };
}

const LANG_FILE = /^index\.(ru|en)\.md$/;

export interface Draftable {
	draft: boolean;
}

export interface DatedContent {
	date: string;
}

export function stringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

export function optionalValue(value: unknown): string | undefined {
	return typeof value === "string" && value ? value : undefined;
}

export function tagsValue(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((tag): tag is string => typeof tag === "string");
}

export function fileLang(path: string): ContentLang {
	const file = path.split("/").pop() ?? "";
	const match = LANG_FILE.exec(file);
	return match?.[1] === "en" ? "en" : "ru";
}

export function toEntry(path: string, module: MarkdownModule): ContentEntry {
	const segments = path.split("/");
	const slug = segments[segments.length - 2] ?? "";
	const fm = module.frontmatter;
	return {
		slug,
		title: stringValue(fm.title) || slug,
		date: stringValue(fm.date),
		tags: tagsValue(fm.tags),
		draft: fm.draft === true,
		image: optionalValue(fm.image),
		module,
	};
}

export function collectByFolder<T>(
	items: T[],
	key: (_item: T) => string,
): Map<string, T[]> {
	const byFolder = new Map<string, T[]>();
	for (const item of items) {
		const folder = key(item);
		const group = byFolder.get(folder);
		if (group) group.push(item);
		else byFolder.set(folder, [item]);
	}
	return byFolder;
}

export function filterDrafts<T extends Draftable>(items: T[]): T[] {
	if (dev) return items;
	return items.filter((item) => !item.draft);
}

export function sortByDateDesc<T extends DatedContent>(items: T[]): T[] {
	return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export function published<T extends Draftable & DatedContent>(items: T[]): T[] {
	return sortByDateDesc(filterDrafts(items));
}
