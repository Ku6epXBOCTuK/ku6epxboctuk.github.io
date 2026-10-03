import { planTagRename } from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/*
 * Предпросмотр: что произойдёт, если переименовать один тег в другой.
 *
 * Отдельный маршрут, а не поле в `GET /api/tags`, потому что вопрос «а что будет,
 * если такой тег уже есть» возникает до нажатия, и ответ меняет формулировку
 * действия: переименование или слияние. Отвечать надо до, а не после.
 */

export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get("from") ?? "";
	const to = url.searchParams.get("to") ?? "";

	try {
		return json({ ok: true, plan: planTagRename(from, to) });
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
