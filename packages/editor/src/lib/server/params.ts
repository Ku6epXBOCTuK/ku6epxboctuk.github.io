import {
	isContentLang,
	isContentType,
	type ContentLang,
	type ContentType,
} from "@ku6epxboctuk/content-core";
import { error, type RequestEvent } from "@sveltejs/kit";

// weekly в CONTENT_TYPES нет, поэтому редактор физически не может его править.

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

export function readLang(event: RequestEvent): ContentLang {
	const { lang } = event.params;
	if (typeof lang !== "string" || !isContentLang(lang)) {
		error(BAD_REQUEST, `Неизвестный язык: ${String(lang)}`);
	}
	return lang;
}
