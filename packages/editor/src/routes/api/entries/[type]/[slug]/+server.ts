import {
	deleteEntry,
	loadEntry,
	renameEntry,
	saveEntry,
	validateEntry,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import { readSlug, readType } from "$lib/server/params.ts";
import {
	cleanRecord,
	fromEntryView,
	toEntryView,
	type EntryView,
} from "$lib/server/entry-view.ts";
import type { RequestHandler } from "./$types";

interface Payload {
	ru?: unknown;
	en?: unknown;
}

function readVersion(raw: unknown): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!raw || typeof raw !== "object") return { frontmatter: {}, body: "" };
	const { frontmatter, body } = raw as {
		frontmatter?: unknown;
		body?: unknown;
	};
	const clean =
		frontmatter &&
		typeof frontmatter === "object" &&
		!Array.isArray(frontmatter)
			? cleanRecord(frontmatter as Record<string, unknown>)
			: {};
	return { frontmatter: clean, body: typeof body === "string" ? body : "" };
}

function readView(payload: Payload | null): EntryView {
	return {
		slug: "",
		ru: readVersion(payload?.ru),
		en: readVersion(payload?.en),
	};
}

export const GET: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const entry = loadEntry(type, slug);
	if (!entry) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	return json({
		...toEntryView(entry),
		validation: validateEntry(type, slug),
	});
};

/**
 * Одно сохранение на единицу, а не по языку: RU и EN лежат в одной записи и
 * расходятся только если разошлись на диске. Сохранение одной языковой версии
 * означало бы, что вторая молча осталась старой.
 */
export const PUT: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);

	const payload = (await event.request
		.json()
		.catch(() => null)) as Payload | null;

	try {
		const { entry } = await saveEntry(
			type,
			slug,
			fromEntryView(type, slug, readView(payload)),
		);
		return json({
			ok: true,
			...toEntryView(entry),
			validation: validateEntry(type, slug),
		});
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
