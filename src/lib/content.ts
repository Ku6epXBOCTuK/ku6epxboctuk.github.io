import { dev } from "$app/environment";
import type { Component } from "svelte";

export interface MarkdownModule<
	TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
> {
	default: Component;
	frontmatter: TFrontmatter;
}

export type Frontmatter = Record<string, unknown>;

/**
 * Плоская запись `<type>s.json`: ключ — slug, значение — общие поля.
 */
export type SharedRecord = Record<string, Frontmatter>;

export interface ContentEntry {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	draft: boolean;
	image?: string;
	/**
	 * Общие поля из json, поверх которых лежит frontmatter языкового файла.
	 *
	 * Сайту не нужно знать, что `date` лежит в json, а `title` в md: он читает
	 * одну склеенную карту. Языковой файл поверх — потому что именно он
	 * переводимый, и именно его правит редактор.
	 */
	frontmatter: Frontmatter;
	module: MarkdownModule;
}

export const DEFAULT_LANG = "ru";
export type ContentLang = "ru" | "en";
export const LANGS: readonly ContentLang[] = ["ru", "en"];

export function browserLang(): ContentLang {
	for (const candidate of navigator.languages) {
		const lang = LANGS.find((item) => candidate.toLowerCase().startsWith(item));
		if (lang) return lang;
	}
	return DEFAULT_LANG;
}

export function pageLang(value: unknown): ContentLang {
	return LANGS.find((item) => item === value) ?? DEFAULT_LANG;
}

export function otherLang(lang: ContentLang): ContentLang {
	return lang === "ru" ? "en" : "ru";
}

export function langUrl(lang: ContentLang | undefined, path: string): string {
	if (!lang) return path;
	return path === "/" ? `/${lang}` : `/${lang}${path}`;
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

export function slugOf(path: string): string {
	const segments = path.split("/");
	return segments[segments.length - 2] ?? "";
}

/**
 * Склейка общего json с языковым frontmatter.
 *
 * Обратная сторона `splitEntry` на стороне записи: там scope раскладывает поля
 * по файлам, здесь они снова собираются в одну карту. Сайт не должен знать
 * раскладку — это дело репозитория и схемы.
 */
export function toEntry(
	path: string,
	module: MarkdownModule,
	shared: SharedRecord = {},
): ContentEntry {
	const slug = slugOf(path);
	const fm: Frontmatter = { ...shared[slug], ...module.frontmatter };

	return {
		slug,
		title: stringValue(fm.title) || slug,
		date: stringValue(fm.date),
		tags: tagsValue(fm.tags),
		draft: fm.draft === true,
		image: optionalValue(fm.image),
		frontmatter: fm,
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
