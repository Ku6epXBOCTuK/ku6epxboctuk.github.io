import { error } from "@sveltejs/kit";
import {
	isContentType,
	type ContentType,
} from "@ku6epxboctuk/content-core/shared";
import type { PageLoad } from "./$types";
import type { UnitDetail } from "$lib/types";

const NOT_FOUND = 404;

export const load: PageLoad = async ({ fetch, params }) => {
	const { type, slug } = params;
	if (!isContentType(type ?? "")) error(NOT_FOUND, `Неизвестный тип: ${type}`);

	const res = await fetch(`/api/units/${type}/${slug}`);
	if (!res.ok) error(NOT_FOUND, `Не найдено: ${type}/${slug}`);

	return {
		type: type as ContentType,
		slug,
		detail: (await res.json()) as UnitDetail,
	};
};
