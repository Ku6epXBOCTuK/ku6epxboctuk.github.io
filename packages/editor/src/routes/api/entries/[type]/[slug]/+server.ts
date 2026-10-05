import {
	deleteEntry,
	entryFromInput,
	loadEntry,
	renameEntry,
	saveEntry,
	validateEntry,
	type ContentType,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import { removeImage } from "$lib/server/images.ts";
import { readSlug, readType } from "$lib/server/params.ts";
import { createPlaceholder } from "$lib/server/placeholder.ts";
import type { RequestHandler } from "./$types";

const PLACEHOLDER_KIND: Record<ContentType, string> = {
	post: "пост",
	article: "статья",
	project: "проект",
};

export const GET: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const entry = loadEntry(type, slug);
	if (!entry) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	return json({ entry, validation: validateEntry(type, slug) });
};

export const PUT: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const payload = await event.request.json().catch(() => null);

	try {
		const input = entryFromInput(type, slug, payload);

		if (!input.shared.image) {
			const title = input.versions.ru.frontmatter.title;
			const name = typeof title === "string" && title ? title : slug;
			input.shared.image = (
				await createPlaceholder(name, slug, PLACEHOLDER_KIND[type])
			).light.path;
		}

		const { entry } = await saveEntry(type, slug, input);
		return json({ ok: true, entry, validation: validateEntry(type, slug) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const image = loadEntry(type, slug)?.shared.image;

	if (!deleteEntry(type, slug)) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	if (typeof image === "string") removeImage(image);

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
