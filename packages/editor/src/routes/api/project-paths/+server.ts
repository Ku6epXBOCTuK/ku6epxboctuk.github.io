import { json } from "@sveltejs/kit";
import { checkProjectPaths } from "@ku6epxboctuk/content-core";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
	return json({ reports: checkProjectPaths() });
};
