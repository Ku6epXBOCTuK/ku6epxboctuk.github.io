import type { SharedRecord } from "$lib/content";

/*
 * Общие поля лежат в `<type>s.json` рядом с папками контента, а не в языковых
 * файлах. Сайт читает и то, и другое, поэтому glob нужен на оба.
 *
 * Файла может не быть вовсе: контента нет, и пустой glob — это норма, а не
 * ошибка сборки. Проверено сборкой, а не предположением.
 */

/**
 * Glob по конкретному файлу отдаёт карту `{путь: содержимое}`, а нужна сама
 * запись. Файл один, поэтому берётся первое значение — если совпадений не было,
 * возвращается `undefined` и склейка его пропустит.
 */
export function sharedFrom(
	glob: Record<string, SharedRecord> | undefined,
): SharedRecord | undefined {
	return Object.values(glob ?? {})[0];
}

/** Склейка нескольких плоских записей; последняя перекрывает предыдущую. */
export function mergeShared(
	...sources: (SharedRecord | undefined)[]
): SharedRecord {
	const out: SharedRecord = {};
	for (const source of sources) {
		for (const [slug, fields] of Object.entries(source ?? {})) {
			out[slug] = { ...out[slug], ...fields };
		}
	}
	return out;
}
