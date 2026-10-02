import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
} from "$lib/content";
import {
	createPairLoader,
	type Frontmatter,
	type LocalizedItem,
	optionalString,
} from "$lib/loaders";
import { modulesOf, sharedOf } from "$lib/content-globs";

export interface ProjectBase extends ContentEntry {
	subtitle?: string;
	description?: string;
	icon?: string;
	color?: string;
	repo?: string;
	homepage?: string;
	status?: string;
	order?: number;
}

export interface Project extends ProjectBase, LocalizedItem {}

function optionalNumber(fm: Frontmatter, key: string): number | undefined {
	const value = fm[key];
	return typeof value === "number" ? value : undefined;
}

const UNORDERED = Number.MAX_SAFE_INTEGER;

const loader = createPairLoader<ProjectBase>({
	modules: modulesOf("project"),
	shared: sharedOf("project"),
	toItem: (entry, fm) => ({
		...entry,
		subtitle: optionalString(fm, "subtitle"),
		description: optionalString(fm, "description"),
		icon: optionalString(fm, "icon"),
		color: optionalString(fm, "color"),
		repo: optionalString(fm, "repo"),
		homepage: optionalString(fm, "homepage"),
		status: optionalString(fm, "status"),
		order: optionalNumber(fm, "order"),
	}),
	sortByDate: false,
});

export function getProjects(lang: ContentLang = DEFAULT_LANG): Project[] {
	return [...loader.getItems(lang)].sort(
		(a, b) => (a.order ?? UNORDERED) - (b.order ?? UNORDERED),
	);
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
