import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import {
	createPairLoader,
	type LocalizedItem,
	optionalString,
} from "$lib/loaders";

const modules = {
	...import.meta.glob<MarkdownModule>(
		"/src/content/projects/*/index.{ru,en}.md",
		{ eager: true },
	),
	...import.meta.glob<MarkdownModule>(
		"/src/content-mocks/projects/*/index.{ru,en}.md",
		{ eager: true },
	),
};

export interface ProjectBase extends ContentEntry {
	subtitle?: string;
	description?: string;
	icon?: string;
	color?: string;
	repo?: string;
	demo?: string;
	status?: string;
	syncedAt?: string;
}

export interface Project extends ProjectBase, LocalizedItem {}

const loader = createPairLoader<ProjectBase>({
	modules,
	toItem: (entry, fm) => ({
		...entry,
		subtitle: optionalString(fm, "subtitle"),
		description: optionalString(fm, "description"),
		icon: optionalString(fm, "icon"),
		color: optionalString(fm, "color"),
		repo: optionalString(fm, "repo"),
		demo: optionalString(fm, "demo"),
		status: optionalString(fm, "status"),
		syncedAt: optionalString(fm, "synced_at"),
	}),
	sortByDate: false,
});

export function getProjects(lang: ContentLang = DEFAULT_LANG): Project[] {
	return loader.getItems(lang);
}

export function getProject(slug: string, lang: ContentLang = DEFAULT_LANG) {
	const meta = loader.getItem(slug, lang);
	if (!meta) return undefined;
	return {
		meta,
		altMeta: loader.getItem(slug, otherLang(lang)) ?? meta,
	};
}

export function getProjectBaseSlugs(): string[] {
	return loader.getSlugs();
}
