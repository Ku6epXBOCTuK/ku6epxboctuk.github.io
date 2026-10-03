import * as fs from "node:fs";
import { join } from "node:path";
import { normalizeTag, tagError } from "./tag-rules.ts";
import { repoRoot } from "./paths.ts";

/*
 * Список тегов, который существует сам по себе: `tags.json` в корне.
 *
 * Раньше список собирался из контента, и из-за этого нельзя было ни завести тег
 * заранее, ни поправить название, пока его ещё нигде не поставили. Теперь
 * словарь живёт отдельно, а контент на него ссылается по имени.
 *
 * Формат плоский и отсортированный: `{ "tags": ["css", "svelte"] }`. Никаких
 * id — см. `planTagRename`: переименование это точная замена значения по всем
 * записям, а не поиск по подстроке.
 *
 * Тег может быть в словаре и не использоваться: это нормально, словарь
 * опережает контент.
 */

const FILE = "tags.json";

interface Registry {
	tags?: unknown;
}

function readRaw(root: string): string[] {
	const path = join(root, FILE);
	if (!fs.existsSync(path)) return [];

	try {
		const parsed = JSON.parse(fs.readFileSync(path, "utf8")) as Registry;
		if (!Array.isArray(parsed.tags)) return [];

		const out: string[] = [];
		for (const item of parsed.tags) {
			if (typeof item !== "string") continue;
			const tag = normalizeTag(item);
			if (!tag || tagError(tag) || out.includes(tag)) continue;
			out.push(tag);
		}

		return out.sort((a, b) => a.localeCompare(b));
	} catch {
		// Битый словарь не должен ронять редактор: контент важнее, а починить
		// файл можно и руками.
		return [];
	}
}

/** Записывает только если содержимое изменилось: иначе файл трогается зря. */
function writeRaw(tags: string[], root: string): void {
	const path = join(root, FILE);
	const next = [...new Set(tags)].sort((a, b) => a.localeCompare(b));
	const current = readRaw(root);

	if (
		next.length === current.length &&
		next.every((tag, i) => tag === current[i])
	) {
		return;
	}

	if (next.length === 0) {
		fs.rmSync(path, { force: true });
		return;
	}

	fs.writeFileSync(
		path,
		`${JSON.stringify({ tags: next }, null, "\t")}\n`,
		"utf8",
	);
}

export function readTagRegistry(root: string = repoRoot()): string[] {
	return readRaw(root);
}

/** Добавить тег в словарь. Если он уже есть — без ошибки: повтор не меняет смысл. */
export function addTagToRegistry(
	tag: string,
	root: string = repoRoot(),
): string[] {
	const value = normalizeTag(tag);
	const error = tagError(value);
	if (error) throw new Error(error);

	const next = readRaw(root);
	if (!next.includes(value)) next.push(value);
	writeRaw(next, root);
	return readRaw(root);
}

/** Переименовать в словаре. Контент этим не трогается — см. `renameTag`. */
export function renameTagInRegistry(
	from: string,
	to: string,
	root: string = repoRoot(),
): string[] {
	const source = normalizeTag(from);
	const target = normalizeTag(to);

	const error = tagError(source) ?? tagError(target);
	if (error) throw new Error(error);
	if (source === target) return readRaw(root);

	// Если целевой уже есть, это слияние словаря: один тег вместо двух.
	const next = readRaw(root).map((tag) => (tag === source ? target : tag));
	writeRaw(next, root);
	return readRaw(root);
}

/** Убрать из словаря. Записи контента остаются как были. */
export function removeTagFromRegistry(
	tag: string,
	root: string = repoRoot(),
): string[] {
	const value = normalizeTag(tag);
	const error = tagError(value);
	if (error) throw new Error(error);

	writeRaw(
		readRaw(root).filter((item) => item !== value),
		root,
	);
	return readRaw(root);
}

export function tagInRegistry(tag: string, root: string = repoRoot()): boolean {
	return readRaw(root).includes(normalizeTag(tag));
}
