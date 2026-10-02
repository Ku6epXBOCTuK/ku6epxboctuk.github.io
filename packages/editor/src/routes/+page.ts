import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import type { EntrySummary } from "@ku6epxboctuk/content-core/shared";

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch("/api/entries");
	if (!res.ok) error(res.status, "Не удалось получить список");

	return { units: (await res.json()) as EntrySummary[] };
};
