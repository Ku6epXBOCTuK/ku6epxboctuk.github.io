import {
	filterDrafts,
	toEntry,
	type ContentEntry,
	type MarkdownModule,
} from "$lib/content";
import { dev } from "$app/environment";

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

const allProjects: Project[] = (() => {
	const projects = Object.entries(modules).map(([path, module]) => {
		const entry = toEntry(path, module);
		const fm = entry.module.frontmatter;
		return {
			...entry,
			subtitle: optionalString(fm.subtitle),
			description: optionalString(fm.description),
			icon: optionalString(fm.icon),
			color: optionalString(fm.color),
			repo: optionalString(fm.repo),
			demo: optionalString(fm.demo),
			status: optionalString(fm.status),
			syncedAt: optionalString(fm.synced_at),
		};
	});
	return dev ? projects : projects.filter((project) => !project.draft);
})();

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value ? value : undefined;
}

export function getProjects(): Project[] {
	return filterDrafts(allProjects);
}
