import {
	deleteUnit,
	isValidSlug,
	readUnit,
	renameUnit,
	summarize,
	validateUnit,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import { readSlug, readType } from "$lib/server/params.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const summary = summarize(type, slug);
	if (summary.langs.length === 0) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	const ru = readUnit(type, slug, "ru");
	const en = readUnit(type, slug, "en");

	return json({
		summary,
		ru: ru && { frontmatter: ru.frontmatter, body: ru.body },
		en: en && { frontmatter: en.frontmatter, body: en.body },
		validation: validateUnit(type, slug),
	});
};

export const DELETE: RequestHandler = (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	if (!deleteUnit(type, slug)) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	return json({ ok: true, deleted: `${type}/${slug}` });
};

/** Переименование меняет URL на сайте, поэтомуUI обязан подтвердить. */
export const PATCH: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const payload = (await event.request.json().catch(() => null)) as {
		slug?: unknown;
	} | null;

	const next = payload?.slug;
	if (typeof next !== "string" || !isValidSlug(next)) {
		return json(
			{ error: `Некорректный slug: ${String(next)}` },
			{ status: 400 },
		);
	}
	if (next === slug) return json({ ok: true, slug });

	try {
		if (!renameUnit(type, slug, next)) {
			return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
		}
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 409 });
	}

	return json({ ok: true, slug: next, validation: validateUnit(type, next) });
};
