import {
	addTagToRegistry,
	collectTags,
	normalizeTag,
	planTagRename,
	readTagRegistry,
	removeTagFromRegistry,
	renameTag,
	renameTagInRegistry,
	removeTag,
	tagError,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

interface Unit {
	type: string;
	slug: string;
}

function usageByTag() {
	return new Map(
		collectTags().map((entry) => [
			entry.tag,
			{ count: entry.units.length, units: entry.units },
		]),
	);
}

interface TagView {
	tag: string;
	count: number;
	units: Unit[];
	listed: boolean;
}

export const GET: RequestHandler = () => {
	const listed = new Set(readTagRegistry());
	const usage = usageByTag();

	const tags: TagView[] = [
		...[...listed].sort((a, b) => a.localeCompare(b)),
		...[...usage.keys()].filter((tag) => !listed.has(tag)),
	]
		.map((tag) => ({
			tag,
			count: usage.get(tag)?.count ?? 0,
			units: usage.get(tag)?.units ?? [],
			listed: listed.has(tag),
		}))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

	return json({ tags });
};

async function readPayload(request: Request): Promise<Record<string, unknown>> {
	try {
		const body = (await request.json()) as unknown;
		if (!body || typeof body !== "object" || Array.isArray(body)) return {};
		return body as Record<string, unknown>;
	} catch {
		return {};
	}
}

function readString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function readBool(value: unknown): boolean {
	return value === true;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await readPayload(request);
	const tag = readString(body.tag);

	try {
		addTagToRegistry(tag);
		return json({ ok: true, listed: readTagRegistry() });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await readPayload(request);
	const from = readString(body.tag);
	const to = readString(body.to);

	if (!to) return json({ error: "Не указано новое имя тега" }, { status: 400 });
	if (!tagError(normalizeTag(from))) {
		return json({ error: tagError(normalizeTag(from)) }, { status: 400 });
	}
	if (tagError(normalizeTag(to))) {
		return json({ error: tagError(normalizeTag(to)) }, { status: 400 });
	}

	const inContent = readBool(body.inContent);
	const inList = readBool(body.inList);

	try {
		let changed = 0;
		if (inContent) changed = (await renameTag(from, to)).changed;
		if (inList) renameTagInRegistry(from, to);

		return json({
			ok: true,
			changed,
			merge: planTagRename(from, to).merge,
			listed: readTagRegistry(),
		});
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await readPayload(request);
	const tag = readString(body.tag);

	const error = tagError(normalizeTag(tag));
	if (error) return json({ error }, { status: 400 });

	const inContent = readBool(body.inContent);
	const inList = readBool(body.inList);

	if (!inContent && !inList) {
		return json(
			{ error: "Скажи, что именно удалять: из списка или из записей" },
			{ status: 400 },
		);
	}

	try {
		let changed = 0;
		if (inContent) changed = (await removeTag(tag)).changed;
		if (inList) removeTagFromRegistry(tag);

		return json({ ok: true, changed, listed: readTagRegistry() });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
