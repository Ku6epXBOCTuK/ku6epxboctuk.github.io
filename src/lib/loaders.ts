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
	getItems(_lang?: ContentLang): T[];
	getItem(_slug: string, _lang?: ContentLang): T | undefined;
	getSlugs(): string[];
}

interface FlatFile<T extends ContentEntry> {
	lang: ContentLang;
	item: T;
}

export function createFlatLoader<T extends ContentEntry>(options: {
	modules: ModuleMap;
	toItem: (_entry: ContentEntry, _fm: Frontmatter) => T;
	sortByDate?: boolean;
}): FlatLoader<T> {
	const grouped = collectByFolder<FlatFile<T>>(
		Object.entries(options.modules).map(([path, module]) => {
			const entry = toEntry(path, module);
			return {
				lang: fileLang(path),
				item: options.toItem(entry, module.frontmatter),
			};
		}),
		(file) => file.item.slug,
	);

	for (const [slug, group] of grouped) {
		const visible = dev ? group : group.filter((file) => !file.item.draft);
		if (visible.length > 0) grouped.set(slug, visible);
		else grouped.delete(slug);
	}

	function pick(
		group: FlatFile<T>[],
		lang?: ContentLang,
	): FlatFile<T> | undefined {
		if (!lang) return group[0];
		return (
			group.find((file) => file.lang === lang) ??
			group.find((file) => file.lang === DEFAULT_LANG) ??
			group[0]
		);
	}

	const sort = (items: T[]) =>
		options.sortByDate === false ? items : published(items);

	return {
		getItems(lang) {
			const items: T[] = [];
			for (const [, group] of grouped) {
				const picked = pick(group, lang);
				if (picked) items.push(picked.item);
			}
			return sort(items);
		},
		getItem(slug, lang) {
			const group = grouped.get(slug);
			if (!group) return undefined;
			return pick(group, lang)?.item;
		},
		getSlugs: () => [...grouped.keys()],
	};
}

export interface PairLoader<T> {
	getItems(_lang?: ContentLang): T[];
	getItem(_slug: string, _lang?: ContentLang): T | undefined;
	getSlugs(): string[];
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
	};
}
