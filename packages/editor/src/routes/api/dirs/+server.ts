import {
	browseRoots,
	dirOf,
	listDirs,
	repoRoot,
} from "@ku6epxboctuk/content-core";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/*
 * Список подкаталогов для выбора пути к клону.
 *
 * Системного диалога у браузера нет: `showDirectoryPicker` отдаёт handle без
 * пути, веб не должен знать расположение файлов. Путь знает только Node, поэтому
 * обзор делается на сервере, а форма просто рисует список.
 *
 * Модель доверия та же, что у всего редактора: loopback без авторизации, и он
 * и так пишет файлы контента на диск. Содержимое файлов не читается — только
 * имена папок и признак «это git-репозиторий».
 */

export const GET: RequestHandler = ({ url }) => {
	const base = repoRoot();
	const asked = url.searchParams.get("path");
	const path = dirOf(asked ?? undefined, base);

	return json({
		...listDirs(path),
		// Точки входа: родитель сайта и выше. Без них пришлось бы вбивать путь
		// руками, что и было исходной проблемой.
		roots: browseRoots(base),
	});
};
