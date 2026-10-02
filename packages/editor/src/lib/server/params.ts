import { isContentType, type ContentType } from "@ku6epxboctuk/content-core";
import { error, type RequestEvent } from "@sveltejs/kit";

// weekly в CONTENT_TYPES нет, поэтому редактор физически не может его править.
// Язык в маршруте тоже не нужен: единица живёт обоими файлами сразу, а
// `/api/entries/[type]/[slug]/[lang]` означал бы сохранение одной половины.

const BAD_REQUEST = 400;

export function readType(event: RequestEvent): ContentType {
	const { type } = event.params;
	if (typeof type !== "string" || !isContentType(type)) {
		error(BAD_REQUEST, `Неизвестный тип: ${String(type)}`);
	}
	return type;
}

export function readSlug(event: RequestEvent): string {
	const { slug } = event.params;
	if (typeof slug !== "string" || !slug) {
		error(BAD_REQUEST, "Не указан slug");
	}
	return slug;
}
