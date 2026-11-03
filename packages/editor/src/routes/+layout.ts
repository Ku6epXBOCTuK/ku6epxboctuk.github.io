import type { LayoutLoad } from "./$types";

// NOTE: this error must not break the page; without a counter the editor shows zero.
export const load: LayoutLoad = async ({ fetch }) => {
	try {
		const res = await fetch("/api/project-paths");
		if (!res.ok) return { broken: 0 };
		const { reports } = (await res.json()) as {
			reports: { state: string }[];
		};
		const broken = reports.filter(
			(report) => report.state === "missing" || report.state === "not-a-repo",
		).length;
		return { broken };
	} catch {
		return { broken: 0 };
	}
};
