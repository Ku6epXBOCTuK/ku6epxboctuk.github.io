import { error } from "@sveltejs/kit";
import type { ProjectPathReport } from "@ku6epxboctuk/content-core/shared";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch("/api/project-paths");
	if (!res.ok) error(res.status, "Не удалось проверить локальные папки");

	const { reports } = (await res.json()) as { reports: ProjectPathReport[] };
	return { reports };
};
