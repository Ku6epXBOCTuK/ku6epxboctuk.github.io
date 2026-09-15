import { getWeeklyReportSlugs } from "$lib/weekly";

export function entries() {
	return getWeeklyReportSlugs().map((slug) => ({ slug }));
}
