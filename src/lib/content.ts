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

interface Draftable {
	draft: boolean;
}

interface DatedContent {
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

export function toEntry(path: string, module: MarkdownModule): ContentEntry {
	const file = path.split("/").pop() ?? "";
	const slug = file.replace(/\.md$/, "");
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
