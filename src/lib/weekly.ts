import {
	DEFAULT_LANG,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import { createFlatLoader, optionalBool, optionalString } from "$lib/loaders";

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

export function getWeeklyReports(
	lang: ContentLang = DEFAULT_LANG,
): WeeklyReport[] {
	return loader.getItems(lang);
}

export function getWeeklyReport(
	slug: string,
	lang: ContentLang = DEFAULT_LANG,
) {
	const report = loader.getItem(slug, lang);
	if (!report) return undefined;
	return { meta: report, ReportComponent: report.module.default };
}

export function getWeeklyReportSlugs(): string[] {
	return loader.getSlugs();
}
