import { json } from "@sveltejs/kit";
import { isValidSlug } from "@ku6epxboctuk/content-core/shared";
import {
	MAX_UPLOAD_BYTES,
	removeImage,
	saveImage,
	type ImageKind,
} from "$lib/server/images.ts";
import type { RequestHandler } from "./$types";

const KINDS: ImageKind[] = ["banner", "content"];

export const POST: RequestHandler = async ({ request }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Ожидается multipart/form-data" }, { status: 400 });
	}

	const file = form.get("file");
	const kind = String(form.get("kind") ?? "");
	const slug = String(form.get("slug") ?? "");
	const replace = String(form.get("replace") ?? "");

	if (!(file instanceof File)) {
		return json({ error: "Нет файла" }, { status: 400 });
	}
	if (!KINDS.includes(kind as ImageKind)) {
		return json({ error: `Неизвестный вид: ${kind}` }, { status: 400 });
	}
	if (slug && !isValidSlug(slug)) {
		return json({ error: `Некорректный slug: ${slug}` }, { status: 400 });
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return json({ error: "Файл слишком большой" }, { status: 413 });
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		const saved = await saveImage({
			buffer,
			mimeType: file.type,
			kind: kind as ImageKind,
			slug,
		});

		if (replace) removeImage(replace);

		return json({ ok: true, ...saved });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
