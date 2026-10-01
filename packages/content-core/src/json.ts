import * as fs from "node:fs";
import { dirname, join } from "node:path";

/**
 * Чтение и запись json рядом с контентом.
 *
 * Запись атомарная: сначала временный файл рядом, потом переименование. Каждая
 * правка единицы переписывает `<type>s.json` целиком, и оборванная запись
 * оставила бы файл, который не парсится, то есть потерял бы весь контент типа,
 * а не одну строку.
 */

const INDENT = "\t";
const NEWLINE = "\n";

export class JsonReadError extends Error {
	constructor(
		readonly file: string,
		readonly cause: unknown,
	) {
		super(`Не удалось прочитать ${file}: ${(cause as Error).message}`);
		this.name = "JsonReadError";
	}
}

export function readJsonFile<T>(file: string): T | undefined {
	if (!fs.existsSync(file)) return undefined;

	let raw: string;
	try {
		raw = fs.readFileSync(file, "utf8");
	} catch (err) {
		throw new JsonReadError(file, err);
	}

	try {
		return JSON.parse(raw) as T;
	} catch (err) {
		throw new JsonReadError(file, err);
	}
}

/**
 * Пишет через временный файл и переименование. Переименование атомарно в
 * пределах каталога, поэтому читатель увидит либо старый файл, либо новый.
 */
export function writeJsonFile(file: string, data: unknown): void {
	fs.mkdirSync(dirname(file), { recursive: true });

	const temp = join(dirname(file), `.${basename(file)}.tmp`);
	try {
		fs.writeFileSync(temp, serialize(data), "utf8");
		fs.renameSync(temp, file);
	} catch (err) {
		// Временный файл не должен пережить неудачную запись: иначе следующий
		// запуск увидит мусор в каталоге контента.
		fs.rmSync(temp, { force: true });
		throw err;
	}
}

export function serialize(data: unknown): string {
	return `${JSON.stringify(data, null, INDENT)}${NEWLINE}`;
}

function basename(file: string): string {
	const parts = file.split(/[\\/]/);
	return parts[parts.length - 1] ?? file;
}

/**
 * Запись, ключ — slug. Порядок ключей стабильный, иначе каждое сохранение
 * переставляло бы строки и в git падала бы диффами без причины.
 */
export function writeJsonRecord(
	file: string,
	entries: Record<string, unknown>,
): void {
	const ordered: Record<string, unknown> = {};
	for (const slug of Object.keys(entries).sort()) {
		ordered[slug] = entries[slug];
	}
	writeJsonFile(file, ordered);
}
