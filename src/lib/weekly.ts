import { createFlatLoader, optionalBool, optionalString } from "$lib/loaders";
import type { ContentEntry, MarkdownModule } from "$lib/content";

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

const loader = createFlatLoader<WeeklyReport>({
	modules,
	toItem: (entry, fm) => ({
		...entry,
		excerpt: optionalString(fm, "excerpt"),
		generated: optionalBool(fm, "generated") ?? false,
		generatedAt: optionalString(fm, "generated_at"),
	}),
});

export function getWeeklyReports(): WeeklyReport[] {
	return loader.getItems();
}

export function getWeeklyReport(slug: string) {
	const report = loader.getItem(slug);
	if (!report) return undefined;
	return { meta: report, ReportComponent: report.module.default };
}
