import { getWeeklyReport, getWeeklyReports } from "$lib/weekly";
import { error } from "@sveltejs/kit";

const NOT_FOUND = 404;

export function entries() {
	return getWeeklyReports().map((report) => ({ slug: report.slug }));
}

export function load({ params }: { params: { slug: string } }) {
	const report = getWeeklyReport(params.slug);

	if (!report) {
		error(NOT_FOUND, "Report not found");
	}

	return {
		meta: report.meta,
		content: report.ReportComponent,
	};
}
