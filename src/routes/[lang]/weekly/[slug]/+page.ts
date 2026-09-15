import { getWeeklyReport, getWeeklyReportSlugs } from "$lib/weekly";
import { LANGS, type ContentLang } from "$lib/content";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return LANGS.flatMap((lang) =>
		getWeeklyReportSlugs().map((slug) => ({ lang, slug })),
	);
}

export function load({
	params,
}: {
	params: { lang: ContentLang; slug: string };
}) {
	const report = getWeeklyReport(params.slug, params.lang);

	if (!report) {
		error(NOT_FOUND, "Report not found");
	}

	return {
		meta: report.meta,
		content: report.ReportComponent,
		alt: {
			meta: report.altMeta,
			content: report.altMeta.module.default,
		},
	};
}
