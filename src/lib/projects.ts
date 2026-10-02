import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
	type SharedRecord,
} from "$lib/content";
import {
	createPairLoader,
	type Frontmatter,
	type LocalizedItem,
	optionalString,
} from "$lib/loaders";
import { mergeShared, sharedFrom } from "$lib/shared";

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

const shared = mergeShared(
	sharedFrom(
		import.meta.glob<SharedRecord>("/src/content/projects.json", {
			eager: true,
			import: "default",
		}),
	),
	sharedFrom(
		import.meta.glob<SharedRecord>("/src/content-mocks/projects.json", {
			eager: true,
			import: "default",
		}),
	),
);

export interface ProjectBase extends ContentEntry {
	subtitle?: string;
	description?: string;
	icon?: string;
	color?: string;
	repo?: string;
	homepage?: string;
	status?: string;
	order?: number;
	syncedAt?: string;
}

export interface Project extends ProjectBase, LocalizedItem {}

function optionalNumber(fm: Frontmatter, key: string): number | undefined {
	const value = fm[key];
	return typeof value === "number" ? value : undefined;
}

const UNORDERED = Number.MAX_SAFE_INTEGER;

const loader = createPairLoader<ProjectBase>({
	modules,
	shared,
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
		syncedAt: optionalString(fm, "synced_at"),
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
