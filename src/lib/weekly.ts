import {
	published,
	toEntry,
	type ContentEntry,
	type MarkdownModule,
} from "$lib/content";
import { dev } from "$app/environment";
import type { Component } from "svelte";

const modules = import.meta.glob<MarkdownModule>(
	"/src/content/weekly/*/index.{ru,en}.md",
	{
		eager: true,
	},
);

export interface WeeklyReport extends ContentEntry {
	excerpt?: string;
	generated?: boolean;
	generatedAt?: string;
}

const allReports: WeeklyReport[] = (() => {
	const reports = Object.entries(modules).map(([path, module]) => {
		const entry = toEntry(path, module);
		const fm = entry.module.frontmatter;
		return {
			...entry,
			excerpt: typeof fm.excerpt === "string" ? fm.excerpt : undefined,
			generated: fm.generated === true,
			generatedAt:
				typeof fm.generated_at === "string" ? fm.generated_at : undefined,
		};
	});
	return dev ? reports : reports.filter((report) => !report.draft);
})();

export function getWeeklyReports(): WeeklyReport[] {
	return published(allReports);
}

export function getWeeklyReport(
	slug: string,
): { meta: WeeklyReport; ReportComponent: Component } | undefined {
	const report = allReports.find((item) => item.slug === slug);
	if (!report) return undefined;
	return { meta: report, ReportComponent: report.module.default };
}
