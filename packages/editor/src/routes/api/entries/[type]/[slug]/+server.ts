import {
	deleteEntry,
	entryFromInput,
	loadEntry,
	renameEntry,
	saveEntry,
	validateEntry,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import { readSlug, readType } from "$lib/server/params.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const entry = loadEntry(type, slug);
	if (!entry) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	return json({ entry, validation: validateEntry(type, slug) });
};

/**
 * Одно сохранение на единицу, а не по языку: RU и EN лежат в одной записи и
 * расходятся только если разошлись на диске. Сохранение одной языковой версии
 * означало бы, что вторая молча осталась старой.
 *
 * На входе — `Entry` целиком, без проекции: приводит к записи `entryFromInput`,
 * раскладывает по файлам репозиторий.
 */
export const PUT: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const payload = await event.request.json().catch(() => null);

	try {
		const { entry } = await saveEntry(
			type,
			slug,
			entryFromInput(type, slug, payload),
		);
		return json({ ok: true, entry, validation: validateEntry(type, slug) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	if (!deleteEntry(type, slug)) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	return json({ ok: true, deleted: `${type}/${slug}` });
};

export const PATCH: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const payload = (await event.request.json().catch(() => null)) as {
		slug?: unknown;
	} | null;

	const next = payload?.slug;
	if (typeof next !== "string") {
		return json({ error: "Не указан новый slug" }, { status: 400 });
	}

	try {
		if (!renameEntry(type, slug, next)) {
			return json({ ok: true, slug, validation: validateEntry(type, slug) });
		}
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 409 });
	}

	return json({ ok: true, slug: next, validation: validateEntry(type, next) });
};
