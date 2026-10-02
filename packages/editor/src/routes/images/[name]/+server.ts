import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { error } from "@sveltejs/kit";
import { imagesDir } from "@ku6epxboctuk/content-core";
import { imageType, safeImageName } from "$lib/server/image-files.ts";
import type { RequestHandler } from "./$types";

/*
 * Картинки контента лежат в `static/images` сайта, а не редактора: сайт их
 * показывает, и в его бандле они должны лежать.
 *
 * Редактор при этом отдаёт `/images` из своего `static`, которого нет, поэтому
 * превью в форме было 404. Этот роут отдаёт те же файлы, что и сайт, из одного
 * места на диске.
 */

const NOT_FOUND = 404;

export const GET: RequestHandler = async ({ params }) => {
	const file = safeImageName(params.name);
	if (!file) error(NOT_FOUND, "Not found");

	const path = join(imagesDir(), file);
	if (!existsSync(path) || !statSync(path).isFile()) {
		error(NOT_FOUND, "Not found");
	}

	const stream = Readable.toWeb(
		createReadStream(path),
	) as unknown as ReadableStream;

	return new Response(stream, {
		headers: {
			"Content-Type": imageType(file) ?? "application/octet-stream",
			"Content-Length": String(statSync(path).size),
			// Имя файла содержит хеш содержимого, поэтому файл неизменяем:
			// прежняя версия получит другое имя.
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
