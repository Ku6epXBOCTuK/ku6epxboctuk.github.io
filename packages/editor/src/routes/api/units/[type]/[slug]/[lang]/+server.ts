import {
	createUnit,
	isValidSlug,
	readUnit,
	unitExists,
	validateUnit,
	writeUnit,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import { readLang, readSlug, readType } from "$lib/server/params.ts";
import type { RequestHandler } from "./$types";

interface Payload {
	frontmatter?: unknown;
	body?: unknown;
}

function readPayload(payload: Payload | null): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!payload || typeof payload !== "object") {
		return { frontmatter: {}, body: "" };
	}

	const { frontmatter, body } = payload;
	const clean: Record<string, unknown> = {};

	if (
		frontmatter &&
		typeof frontmatter === "object" &&
		!Array.isArray(frontmatter)
	) {
		for (const [key, value] of Object.entries(frontmatter)) {
			if (value === null || value === "") continue;
			if (Array.isArray(value)) {
				clean[key] = value.filter((item) => item !== "");
			} else {
				clean[key] = value;
			}
		}
	}

	return { frontmatter: clean, body: typeof body === "string" ? body : "" };
}

export const POST: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);
	const lang = readLang(event);

	if (!isValidSlug(slug)) {
		return json({ error: `Некорректный slug: ${slug}` }, { status: 400 });
	}
	if (readUnit(type, slug, lang)) {
		return json(
			{ error: `Файл уже существует: ${type}/${slug}/${lang}` },
			{ status: 409 },
		);
	}

	const content = readPayload(
		(await event.request.json().catch(() => null)) as Payload | null,
	);

	try {
		await createUnit(type, slug, lang, content);
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}

	return json(
		{
			ok: true,
			created: `${type}/${slug}/${lang}`,
			validation: validateUnit(type, slug),
		},
		{ status: 201 },
	);
};

export const PUT: RequestHandler = async (event) => {
	const type = readType(event);
	const slug = readSlug(event);
	const lang = readLang(event);

	if (!isValidSlug(slug)) {
		return json({ error: `Некорректный slug: ${slug}` }, { status: 400 });
	}
	if (!unitExists(type, slug)) {
		return json({ error: `Не найдено: ${type}/${slug}` }, { status: 404 });
	}

	const content = readPayload(
		(await event.request.json().catch(() => null)) as Payload | null,
	);

	await writeUnit(type, slug, lang, content);

	return json({
		ok: true,
		saved: `${type}/${slug}/${lang}`,
		validation: validateUnit(type, slug),
	});
};
