import { createFlatLoader, optionalString } from "$lib/loaders";
import type { ContentEntry, MarkdownModule } from "$lib/content";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/projects/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface Project extends ContentEntry {
	subtitle?: string;
	description?: string;
	icon?: string;
	color?: string;
	repo?: string;
	demo?: string;
	status?: string;
	syncedAt?: string;
}

const loader = createFlatLoader<Project>({
	modules,
	sortByDate: false,
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
});

export function getProjects(): Project[] {
	return loader.getItems();
}
