import { error } from "@sveltejs/kit";
import type { EntrySummary } from "@ku6epxboctuk/content-core/shared";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch("/api/entries?type=project");
	if (!res.ok) error(res.status, "Не удалось получить список");

	return { units: (await res.json()) as EntrySummary[] };
};
