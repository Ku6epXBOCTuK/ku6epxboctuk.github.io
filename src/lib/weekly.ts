import {
	DEFAULT_LANG,
	otherLang,
	type ContentEntry,
	type ContentLang,
	type MarkdownModule,
} from "$lib/content";
import {
	createPairLoader,
	optionalString,
	type LocalizedItem,
} from "$lib/loaders";

const modules = {
	...import.meta.glob<MarkdownModule>(
		"/src/content/weekly/*/index.{ru,en}.md",
		{ eager: true },
	),
	...import.meta.glob<MarkdownModule>(
		"/src/content-mocks/weekly/*/index.{ru,en}.md",
		{ eager: true },
	),
};

export interface WeeklyReportBase extends ContentEntry {
	excerpt?: string;
}

export interface WeeklyReport extends WeeklyReportBase, LocalizedItem {}

const loader = createPairLoader<WeeklyReportBase>({
	modules,
	toItem: (entry, fm) => ({
		...entry,
		excerpt: optionalString(fm, "excerpt"),
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
	return {
		meta: report,
		ReportComponent: report.module.default,
		altMeta: loader.getItem(slug, otherLang(lang)) ?? report,
	};
}

export function getWeeklyReportSlugs(): string[] {
	return loader.getSlugs();
}
