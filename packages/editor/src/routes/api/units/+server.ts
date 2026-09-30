import { json } from "@sveltejs/kit";
import {
	CONTENT_TYPES,
	listAll,
	type ContentType,
} from "@ku6epxboctuk/content-core";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
	const requested = url.searchParams.get("type") ?? "";
	const all = listAll();

	if (!requested) return json(all);

	if (!(CONTENT_TYPES as readonly string[]).includes(requested)) {
		return json({ error: `Неизвестный тип: ${requested}` }, { status: 400 });
	}

	return json(all.filter((unit) => unit.type === (requested as ContentType)));
};
