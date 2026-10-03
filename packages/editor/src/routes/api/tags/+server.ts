import {
	collectTags,
	renameTag,
	removeTag,
	tagError,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/*
 * Теги правятся разом по всему контенту: тег лежит в нескольких единицах, и
 * «переименовать» значит «переименовать везде». Списка тегов отдельно нет, он
 * собирается из контента, поэтому разойтись с ним невозможно.
 */

export const GET: RequestHandler = () => {
	return json({
		tags: collectTags().map((entry) => ({
			tag: entry.tag,
			count: entry.units.length,
			units: entry.units,
		})),
	});
};

interface Payload {
	tag?: unknown;
	to?: unknown;
}

async function readPayload(request: Request): Promise<Payload> {
	try {
		const body = (await request.json()) as unknown;
		if (!body || typeof body !== "object" || Array.isArray(body)) return {};
		return body as Payload;
	} catch {
		return {};
	}
}

function readString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

export const PUT: RequestHandler = async ({ request }) => {
	const { tag, to } = await readPayload(request);
	const from = readString(tag);
	const target = readString(to);

	const error = tagError(from) ?? (target ? tagError(target) : null);
	if (error) return json({ error }, { status: 400 });
	if (!target)
		return json({ error: "Не указано новое имя тега" }, { status: 400 });

	try {
		return json({ ok: true, ...(await renameTag(from, target)) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { tag } = await readPayload(request);
	const value = readString(tag);

	const error = tagError(value);
	if (error) return json({ error }, { status: 400 });

	try {
		return json({ ok: true, ...(await removeTag(value)) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
