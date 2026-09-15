import { dev } from "$app/environment";
import {
	collectByFolder,
	DEFAULT_LANG,
	fileLang,
	published,
	toEntry,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";

export type ModuleMap = Record<string, MarkdownModule>;

export type Frontmatter = Record<string, unknown>;

export function optionalString(
	fm: Frontmatter,
	key: string,
): string | undefined {
	const value = fm[key];
	return typeof value === "string" && value ? value : undefined;
}

export function optionalBool(
	fm: Frontmatter,
	key: string,
): boolean | undefined {
	const value = fm[key];
	return typeof value === "boolean" ? value : undefined;
}

export interface LocalizedItem {
	lang: ContentLang;
	langs: ContentLang[];
}

export interface FlatLoader<T> {
	getItems(): T[];
	getItem(_slug: string): T | undefined;
	getSlugs(): string[];
}

export function createFlatLoader<T extends ContentEntry>(options: {
	modules: ModuleMap;
	toItem: (_entry: ContentEntry, _fm: Frontmatter) => T;
	sortByDate?: boolean;
}): FlatLoader<T> {
	const items = Object.entries(options.modules).map(([path, module]) =>
		options.toItem(toEntry(path, module), module.frontmatter),
	);
	const visible = dev ? items : items.filter((item) => !item.draft);
	const getItems = () =>
		options.sortByDate === false ? visible : published(visible);
	return {
		getItems,
		getItem: (slug) => visible.find((item) => item.slug === slug),
		getSlugs: () => visible.map((item) => item.slug),
	};
}

export interface PairLoader<T> {
	getItems(_lang?: ContentLang): T[];
	getItem(_slug: string, _lang?: ContentLang): T | undefined;
	getSlugs(): string[];
	getLangs(_slug: string): ContentLang[];
}

interface PairFile<T extends ContentEntry> {
	lang: ContentLang;
	entry: ContentEntry;
	item: T;
}

export function createPairLoader<T extends ContentEntry>(options: {
	modules: ModuleMap;
	toItem: (_entry: ContentEntry, _fm: Frontmatter) => T;
}): PairLoader<T & LocalizedItem> {
	const grouped = collectByFolder<PairFile<T>>(
		Object.entries(options.modules).map(([path, module]) => {
			const entry = toEntry(path, module);
			return {
				lang: fileLang(path),
				entry,
				item: options.toItem(entry, module.frontmatter),
			};
		}),
		(file) => file.entry.slug,
	);

	const byBase = new Map<string, PairFile<T>[]>();
	for (const [slug, group] of grouped) {
		const visible = dev ? group : group.filter((file) => !file.entry.draft);
		if (visible.length > 0) byBase.set(slug, visible);
	}

	function pick(
		group: PairFile<T>[],
		lang: ContentLang,
	): PairFile<T> | undefined {
		return (
			group.find((file) => file.lang === lang) ??
			group.find((file) => file.lang === DEFAULT_LANG) ??
			group[0]
		);
	}

	return {
		getItems(lang = DEFAULT_LANG) {
			const items: Array<T & LocalizedItem> = [];
			for (const [slug, group] of byBase) {
				const picked = pick(group, lang);
				if (picked) {
					items.push({
						...picked.item,
						lang: picked.lang,
						langs: byBase.get(slug)?.map((file) => file.lang) ?? [],
					});
				}
			}
			return published(items);
		},
		getItem(slug, lang = DEFAULT_LANG) {
			const group = byBase.get(slug);
			if (!group) return undefined;
			const picked = pick(group, lang);
			if (!picked) return undefined;
			return {
				...picked.item,
				lang: picked.lang,
				langs: group.map((file) => file.lang),
			};
		},
		getSlugs: () => [...byBase.keys()],
		getLangs(slug) {
			return byBase.get(slug)?.map((file) => file.lang) ?? [];
		},
	};
}
