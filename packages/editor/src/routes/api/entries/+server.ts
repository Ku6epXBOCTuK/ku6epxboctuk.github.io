import { listEntries } from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import {
	CONTENT_TYPES,
	type ContentType,
} from "@ku6epxboctuk/content-core/shared";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
	const requested = url.searchParams.get("type");

	if (requested && !CONTENT_TYPES.includes(requested as ContentType)) {
		return json({ error: `Неизвестный тип: ${requested}` }, { status: 400 });
	}

	const types = requested ? [requested as ContentType] : [...CONTENT_TYPES];

	return json(types.flatMap((type) => listEntries(type)));
};
