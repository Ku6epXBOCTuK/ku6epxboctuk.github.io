import {
	browseRoots,
	dirOf,
	listDirs,
	repoRoot,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
	const base = repoRoot();
	const asked = url.searchParams.get("path");
	const path = dirOf(asked ?? undefined, base);

	return json({
		...listDirs(path),
		roots: browseRoots(base),
	});
};
