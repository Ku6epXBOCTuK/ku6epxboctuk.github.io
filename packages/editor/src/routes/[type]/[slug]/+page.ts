import { error } from "@sveltejs/kit";
import {
	isContentType,
	type ContentType,
} from "@ku6epxboctuk/content-core/shared";
import type { PageLoad } from "./$types";
import type { EntryView, LegacyVersion } from "$lib/server/entry-view.ts";

const NOT_FOUND = 404;

export interface LoadedEntry extends EntryView {
	validation: { errors: string[]; warnings: string[] };
}

export const load: PageLoad = async ({ fetch, params }) => {
	const { type, slug } = params;
	if (!isContentType(type ?? "")) error(NOT_FOUND, `Неизвестный тип: ${type}`);

	const res = await fetch(`/api/entries/${type}/${slug}`);
	if (!res.ok) error(NOT_FOUND, `Не найдено: ${type}/${slug}`);

	const { ru, en, validation } = (await res.json()) as LoadedEntry;

	return {
		type: type as ContentType,
		slug,
		// Обе версии есть всегда: единица живёт двумя файлами, а состояния
		// «файла нет» в редакторе не существует.
		detail: {
			ru: ru as LegacyVersion,
			en: en as LegacyVersion,
			validation,
		},
	};
};
