import { planTagRename } from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get("from") ?? "";
	const to = url.searchParams.get("to") ?? "";

	try {
		return json({ ok: true, plan: planTagRename(from, to) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
